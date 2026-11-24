using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServerAPI.Models.Schedule;
using ServerAPI.Services.Schedule;
using System.Security.Claims;

namespace ServerAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ScheduleController : ControllerBase
    {
        private readonly IScheduleService _scheduleService;
        private readonly ILogger<ScheduleController> _logger;

        public ScheduleController(IScheduleService scheduleService, ILogger<ScheduleController> logger)
        {
            _scheduleService = scheduleService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllWorkouts()
        {
            try
            {
                var workouts = await _scheduleService.GetAllWorkoutsAsync();
                return Ok(workouts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all workouts.");
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetWorkoutById(string id)
        {
            try
            {
                var workout = await _scheduleService.GetWorkoutByIdAsync(id);
                if (workout == null)
                {
                    return NotFound(new { code = "WORKOUT_NOT_FOUND", message = $"Workout with ID {id} not found." });
                }

                return Ok(new
                {
                    message = "Successfully retrieved workout details.",
                    workout = new
                    {
                        workout.Id,
                        workout.Day,
                        workout.Time,
                        workout.Date,
                        workout.Status,
                        workout.AvailableSpots,
                        workout.TakenSpots,
                        workout.TotalSpots,
                        Shoes = (workout.WorkoutShoes ?? Enumerable.Empty<Models.WorkoutShoes>())
                            .Where(s => s.Shoe != null)
                            .Select(s => new
                            {
                                s.Shoe.Id,
                                s.Shoe.Size,
                                s.IsTaken
                            })
                    }
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { code = "WORKOUT_NOT_FOUND", message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting workout by ID: {WorkoutId}", id);
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        [HttpPost("apply")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> ApplyForWorkout([FromBody] ApplyForWorkoutRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { code = "INVALID_REQUEST", message = "Request body is required." });
            }

            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                _logger.LogInformation("Received request to apply for workout: {WorkoutId} with userId: {UserId}", request.WorkoutId, userId);

                var updatedWorkout = await _scheduleService.ApplyForWorkoutAsync(
                    request.WorkoutId,
                    request.ShoeSize,
                    request.CardType,
                    userId,
                    request.UsesOwnShoes,
                    requireConfirmedEmail: true
                );

                return Ok(new
                {
                    message = "Successfully applied for the workout.",
                    workout = updatedWorkout
                });
            }
            catch (ScheduleBookingException ex)
            {
                _logger.LogWarning("Booking failed with code {Code}: {Message}", ex.Code, ex.Message);
                return ToActionResult(ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error applying for workout.");
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        [HttpGet("is-registered/{workoutId}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult<bool>> IsUserRegistered(string workoutId)
        {
            try
            {
                _logger.LogInformation("Checking registration status for workout {WorkoutId}", workoutId);
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrWhiteSpace(workoutId))
                {
                    return BadRequest(new { code = "WORKOUT_NOT_FOUND", message = "Workout ID is required." });
                }

                var isRegistered = await _scheduleService.IsUserRegisteredAsync(workoutId, userId);
                _logger.LogInformation("User {UserId} registration status for workout {WorkoutId}: {IsRegistered}", userId, workoutId, isRegistered);
                return Ok(isRegistered);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { code = "USER_NOT_FOUND", message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking registration status");
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        [HttpDelete("cancel-registration/{workoutId}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> CancelRegistration(string workoutId)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var isCanceled = await _scheduleService.CancelRegistrationAsync(workoutId, userId, allowPastWorkout: false);

                if (!isCanceled)
                {
                    return NotFound(new { code = "REGISTRATION_NOT_FOUND", message = "Registration not found." });
                }

                return Ok(new { message = "Registration canceled successfully." });
            }
            catch (ScheduleBookingException ex)
            {
                _logger.LogWarning("Cancel registration failed with code {Code}: {Message}", ex.Code, ex.Message);
                return ToActionResult(ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error canceling registration");
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        private IActionResult ToActionResult(ScheduleBookingException ex)
        {
            var payload = new { code = ex.Code, message = ex.Message };
            return ex.ErrorCode switch
            {
                BookingErrorCode.WorkoutNotFound or BookingErrorCode.UserNotFound => NotFound(payload),
                BookingErrorCode.AlreadyRegistered or BookingErrorCode.NoAvailableSpots or BookingErrorCode.NoAvailableShoes or BookingErrorCode.ConcurrencyConflict => Conflict(payload),
                _ => BadRequest(payload)
            };
        }
    }
}
