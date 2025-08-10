using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ServerAPI.Models.Schedule;
using ServerAPI.Services.Schedule;
using System.Security.Claims;
using System.Threading.Tasks;

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
                var workouts = await _scheduleService.GetAllWorkoutsAsync<WorkoutViewModels>();
                return Ok(workouts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all workouts.");
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
                    message = "Successfully retrieved workout details.",
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
                _logger.LogError(ex, $"Error getting workout by ID: {id}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("apply")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> ApplyForWorkout([FromBody] ApplyForWorkoutRequest request)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                _logger.LogInformation($"Received request to apply for workout: {request.WorkoutId} with userId: {userId}");
                
                var updatedWorkout = await _scheduleService.ApplyForWorkoutAsync(
                    request.WorkoutId,
                    request.ShoeSize, 
                    request.CardType,
                    userId, 
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
                _logger.LogError(ex, "Error applying for workout.");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
        
        [HttpGet("is-registered/{workoutId}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult<bool>> IsUserRegistered(string workoutId)
        {
            try
            {
                _logger.LogInformation($"Checking registration status for workout {workoutId}");
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                
                if (string.IsNullOrWhiteSpace(workoutId))
                {
                    return BadRequest("Workout ID is required");
                }

                var isRegistered = await _scheduleService.IsUserRegisteredAsync(workoutId, userId);
                _logger.LogInformation($"User {userId} registration status for workout {workoutId}: {isRegistered}");
                return Ok(isRegistered);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking registration status");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpDelete("cancel-registration/{workoutId}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> CancelRegistration(string workoutId)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                
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
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}