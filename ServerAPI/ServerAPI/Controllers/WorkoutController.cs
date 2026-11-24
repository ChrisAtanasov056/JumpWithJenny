using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ServerAPI.Common;
using ServerAPI.Models.Schedule;
using ServerAPI.Services.Schedule;
using ServerAPI.Services.Workouts;
using ServerAPI.ViewModels;
using ServerAPI.ViewModels.Workout;

namespace ServerAPI.Controllers
{
    [Authorize(Roles = GlobalConstants.AdministratorRoleName)]
    [Route("api/[controller]")]
    [ApiController]
    public class WorkoutController : ControllerBase
    {
        private readonly IWorkoutServices _workoutService;
        private readonly ILogger<WorkoutController> _logger;

        private readonly IScheduleService _scheduleService;
        public WorkoutController(
            IWorkoutServices workoutService,
            ILogger<WorkoutController> logger
            , IScheduleService scheduleService)
        {
            _workoutService = workoutService;
            _logger = logger;
            _scheduleService = scheduleService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateWorkout([FromBody] WorkoutCreateModel workoutDto)
        {
            try
            {
                var createdWorkout = await _workoutService.CreateWorkoutAsync(workoutDto);
                return CreatedAtAction(nameof(GetWorkout), new { id = createdWorkout.Id }, createdWorkout);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating workout");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateWorkout(string id, [FromBody] WorkoutUpdateModel workoutDto)
        {
            try
            {
                var updatedWorkout = await _workoutService.UpdateWorkoutAsync(id, workoutDto);
                return Ok(updatedWorkout);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex.Message);
                return NotFound(ex.Message);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogWarning(ex, "Concurrency conflict updating workout {WorkoutId}", id);
                return Conflict(new { message = "The workout was modified by another request. Please reload and try again." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating workout");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpDelete("delete-workout/{id}")]
        public async Task<IActionResult> DeleteWorkout(string id)
        {
            if (string.IsNullOrEmpty(id))
            {
                return BadRequest("Workout ID cannot be null or empty");
            }
            try
            {
                await _workoutService.DeleteWorkoutAsync(id);

                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, $"Not Found: {ex.Message}");
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting workout {id}");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetWorkout(string id)
        {
            try
            {
                var workout = await _scheduleService.GetWorkoutByIdAsync(id);
                return Ok(workout);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex.Message);
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving workout");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAllWorkouts()
        {
            try
            {
                var workouts = await _workoutService.GetAllWorkoutsAsync();
                _logger.LogInformation($"Retrieved {workouts.Count()} workouts");
                return Ok(workouts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving workouts");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}