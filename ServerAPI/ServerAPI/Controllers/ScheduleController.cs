namespace ServerAPI.Controllers
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Http;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.Extensions.Logging;
    using ServerAPI.Models.Schedule;
    using ServerAPI.Services.Schedule;
    using System;
    using System.Threading.Tasks;

    [Route("api/[controller]")]
    [ApiController]
    public class ScheduleController : ControllerBase
    {
        private readonly IScheduleService _scheduleService;

        private IHttpContextAccessor _httpContextAccessor;

        private readonly ILogger<ScheduleController> _logger;

        public ScheduleController(IScheduleService scheduleService, IHttpContextAccessor httpContextAccessor, ILogger<ScheduleController> logger)
        {
            _scheduleService = scheduleService;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllWorkouts()
        {
            try
            {
                var workouts = await _scheduleService.GetAllWorkoutsAsync<WorkoutViewModels>();
                return Ok(workouts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetWorkoutById(string id)
        {
            try
            {
                var workout = await _scheduleService.GetWorkoutByIdAsync<WorkoutViewModels>(id);
                if (workout == null)
                {
                    return NotFound($"Workout with ID {id} not found.");
                }
                return Ok(new
                {
                    message = "Successfully applied for the workout.",
                    workout = new
                    {
                        workout.Id,
                        workout.Day,
                        workout.Time,
                        workout.Status,
                        workout.AvailableSpots,
                        Shoes = workout.WorkoutShoes.Select(s => new
                        {
                            s.Shoe.Id,
                            s.Shoe.Size,
                            s.IsTaken
                        })
                    }
                    });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("apply")]
        public async Task<IActionResult> ApplyForWorkout([FromBody] ApplyForWorkoutRequest request)
        {
            try
            {
                var updatedWorkout = await _scheduleService.ApplyForWorkoutAsync(
                    request.WorkoutId,
                    request.ShoeSize, 
                    request.CardType,
                    request.UserId,
                    request.UsesOwnShoes
                );

                if (updatedWorkout == null)
                {
                    return BadRequest("Unable to apply for the workout. No available shoes of the requested size or no spots left.");
                }

                return Ok(new
                {
                    message = "Successfully applied for the workout.",
                    workout = new
                    {
                        updatedWorkout.Id,
                        updatedWorkout.Day,
                        updatedWorkout.Time,
                        updatedWorkout.Status,
                        updatedWorkout.AvailableSpots,
                        Shoes = updatedWorkout.WorkoutShoes.Select(s => new
                        {
                            s.Shoe.Id,
                            s.Shoe.Size,
                    
                        })
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("is-registered/{workoutId}")]
        [AllowAnonymous]
        public async Task<ActionResult<bool>> IsUserRegistered(string workoutId)
        {
            try
            {
                // Get userId from cookie
                var userId = _httpContextAccessor.HttpContext?.Request.Cookies["user-id"];
                _logger.LogInformation($"Retrieved userId from cookie: {userId}");
                if (string.IsNullOrEmpty(userId))
                {
                    return Ok(false); // Not registered if no cookie
                }

                // Validate inputs
                if (string.IsNullOrWhiteSpace(workoutId))
                {
                    return BadRequest("Workout ID is required");
                }

                var isRegistered = await _scheduleService.IsUserRegisteredAsync(workoutId, userId);
                return Ok(isRegistered);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking registration status");
                return StatusCode(500, "Error checking registration status");
            }
        }

        [HttpDelete("cancel-registration/{workoutId}")]
        [AllowAnonymous]
        public async Task<IActionResult> CancelRegistration(string workoutId)
        {
            try
            {
                // Get userId from cookie
                var userId = _httpContextAccessor.HttpContext?.Request.Cookies["user-id"];
                _logger.LogInformation($"Retrieved userId from cookie: {userId}");

                // Call the service to cancel the registration
                var isCanceled = await _scheduleService.CancelRegistrationAsync(workoutId, userId);

                if (!isCanceled)
                {
                    return NotFound("Registration not found.");
                }

                return Ok("Registration canceled successfully.");
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex.Message);
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error canceling registration");
                return StatusCode(500, "Error canceling registration");
            }
        }
    }
}