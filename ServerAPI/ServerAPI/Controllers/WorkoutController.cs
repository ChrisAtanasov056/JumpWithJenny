using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ServerAPI.Models.Schedule;
using ServerAPI.Services.Schedule;
using ServerAPI.Services.Workouts;
using ServerAPI.ViewModels;
using ServerAPI.ViewModels.Workout;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ServerAPI.Controllers
{
    [Authorize(Roles = "Administrator")]   
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
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex.Message);
                return NotFound(ex.Message);
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
        [AllowAnonymous]
        public async Task<IActionResult> GetWorkout(string id)
        {
            try
            {
                var workout = await _scheduleService.GetWorkoutByIdAsync<WorkoutViewModels>(id);
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
        [AllowAnonymous]
        public async Task<IActionResult> GetAllWorkouts()
        {
            try
            {
                var workouts = await _scheduleService.GetAllWorkoutsAsync<WorkoutViewModels>();
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