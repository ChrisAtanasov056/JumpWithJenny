namespace ServerAPI.Services
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Threading;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Diagnostics;
    using Microsoft.AspNetCore.Http;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.EntityFrameworkCore;
    using Microsoft.Extensions.Hosting;
    using Microsoft.Extensions.Logging;
    using ServerAPI.Models.Schedule;

    public sealed class GlobalExceptionHandler : IExceptionHandler
    {
        private readonly IProblemDetailsService _problemDetailsService;
        private readonly ILogger<GlobalExceptionHandler> _logger;
        private readonly IHostEnvironment _environment;

        public GlobalExceptionHandler(
            IProblemDetailsService problemDetailsService,
            ILogger<GlobalExceptionHandler> logger,
            IHostEnvironment environment)
        {
            _problemDetailsService = problemDetailsService;
            _logger = logger;
            _environment = environment;
        }

        public async ValueTask<bool> TryHandleAsync(
            HttpContext httpContext,
            Exception exception,
            CancellationToken cancellationToken)
        {
            var (statusCode, title, detail, errorCode) = MapException(exception);

            if (statusCode >= StatusCodes.Status500InternalServerError)
            {
                _logger.LogError(
                    exception,
                    "Unhandled exception processing {Method} {Path}",
                    httpContext.Request.Method,
                    httpContext.Request.Path);
            }
            else
            {
                _logger.LogWarning(
                    "Request {Method} {Path} failed with {StatusCode} ({ErrorCode}): {Message}",
                    httpContext.Request.Method,
                    httpContext.Request.Path,
                    statusCode,
                    errorCode ?? "NONE",
                    exception.Message);
            }

            var problemDetails = new ProblemDetails
            {
                Status = statusCode,
                Title = title,
                Detail = detail,
                Type = GetRfcType(statusCode),
                Instance = $"{httpContext.Request.Method} {httpContext.Request.Path}",
            };

            problemDetails.Extensions["traceId"] = Activity.Current?.Id ?? httpContext.TraceIdentifier;
            problemDetails.Extensions["message"] = detail;

            if (!string.IsNullOrWhiteSpace(errorCode))
            {
                problemDetails.Extensions["code"] = errorCode;
            }

            httpContext.Response.StatusCode = statusCode;

            var written = await _problemDetailsService.TryWriteAsync(new ProblemDetailsContext
            {
                HttpContext = httpContext,
                Exception = exception,
                ProblemDetails = problemDetails,
            });

            if (!written)
            {
                httpContext.Response.ContentType = "application/problem+json";
                await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
            }

            return true;
        }

        private (int StatusCode, string Title, string Detail, string ErrorCode) MapException(Exception exception)
        {
            switch (exception)
            {
                case ScheduleBookingException bookingEx:
                    var bookingStatus = bookingEx.ErrorCode switch
                    {
                        BookingErrorCode.WorkoutNotFound or BookingErrorCode.UserNotFound or BookingErrorCode.BookingNotFound => StatusCodes.Status404NotFound,
                        BookingErrorCode.AlreadyRegistered or BookingErrorCode.MaxActiveBookingsReached or BookingErrorCode.NoAvailableSpots or BookingErrorCode.NoAvailableShoes or BookingErrorCode.ConcurrencyConflict => StatusCodes.Status409Conflict,
                        _ => StatusCodes.Status400BadRequest,
                    };
                    return (bookingStatus, GetDefaultTitle(bookingStatus), bookingEx.Message, bookingEx.Code);

                case KeyNotFoundException:
                    return (StatusCodes.Status404NotFound, "Not Found", exception.Message, null);

                case ArgumentException:
                case InvalidOperationException:
                    return (StatusCodes.Status400BadRequest, "Bad Request", exception.Message, null);

                case UnauthorizedAccessException:
                    return (StatusCodes.Status401Unauthorized, "Unauthorized", "Authentication is required to access this resource.", null);

                case DbUpdateConcurrencyException:
                    return (
                        StatusCodes.Status409Conflict,
                        "Conflict",
                        "The resource was modified by another request. Please reload and try again.",
                        "CONCURRENCY_CONFLICT");

                default:
                    var detail = _environment.IsDevelopment()
                        ? exception.Message
                        : "An unexpected error occurred. Please try again later.";
                    return (StatusCodes.Status500InternalServerError, "Internal Server Error", detail, null);
            }
        }

        private static string GetDefaultTitle(int statusCode) => statusCode switch
        {
            StatusCodes.Status400BadRequest => "Bad Request",
            StatusCodes.Status401Unauthorized => "Unauthorized",
            StatusCodes.Status403Forbidden => "Forbidden",
            StatusCodes.Status404NotFound => "Not Found",
            StatusCodes.Status409Conflict => "Conflict",
            StatusCodes.Status429TooManyRequests => "Too Many Requests",
            _ => "Internal Server Error",
        };

        private static string GetRfcType(int statusCode) => statusCode switch
        {
            StatusCodes.Status400BadRequest => "https://tools.ietf.org/html/rfc9110#section-15.5.1",
            StatusCodes.Status401Unauthorized => "https://tools.ietf.org/html/rfc9110#section-15.5.2",
            StatusCodes.Status403Forbidden => "https://tools.ietf.org/html/rfc9110#section-15.5.4",
            StatusCodes.Status404NotFound => "https://tools.ietf.org/html/rfc9110#section-15.5.5",
            StatusCodes.Status409Conflict => "https://tools.ietf.org/html/rfc9110#section-15.5.10",
            StatusCodes.Status429TooManyRequests => "https://tools.ietf.org/html/rfc6585#section-4",
            _ => "https://tools.ietf.org/html/rfc9110#section-15.6.1",
        };
    }
}
