using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ServerAPI.Models.Schedule;
using ServerAPI.Services.Schedule;
using System.Threading;

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
        [AllowAnonymous]
        public async Task<IActionResult> GetAllWorkouts(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            CancellationToken cancellationToken = default)
        {
            var workouts = await _scheduleService.GetAllWorkoutsAsync(page, pageSize, cancellationToken);
            return Ok(workouts);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetWorkoutById(string id)
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

        [HttpPost("apply")]
        [AllowAnonymous]
        [EnableRateLimiting("BookingPolicy")]
        public async Task<IActionResult> ApplyForWorkout([FromBody] ApplyForWorkoutRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { code = "INVALID_REQUEST", message = "Request body is required." });
            }

            _logger.LogInformation("Received public booking request for workout {WorkoutId}", request.WorkoutId);

            var bookingResult = await _scheduleService.ApplyForWorkoutAsync(
                request,
                allowPastWorkout: false,
                enforceBookingLimits: true,
                sendConfirmationEmail: true);

            return Ok(new
            {
                message = "Successfully applied for the workout.",
                workout = bookingResult.Workout,
                cancellationToken = bookingResult.CancellationToken
            });
        }

        [HttpGet("cancel/{token}")]
        [AllowAnonymous]
        [EnableRateLimiting("CancelBookingPolicy")]
        public async Task<IActionResult> GetBookingByCancellationToken(string token)
        {
            var details = await _scheduleService.GetCancellationDetailsByTokenAsync(token);
            return Ok(details);
        }

        [HttpPost("cancel/{token}")]
        [AllowAnonymous]
        [EnableRateLimiting("CancelBookingPolicy")]
        public async Task<IActionResult> CancelBookingByToken(string token)
        {
            await _scheduleService.CancelByTokenAsync(token);
            return Ok(new { message = "Registration canceled successfully." });
        }
    }
}
