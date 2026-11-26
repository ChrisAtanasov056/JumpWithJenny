using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServerAPI.Common;
using ServerAPI.Models.Admin;
using ServerAPI.Services.Schedule;
using ServerAPI.Services.Workouts;
using ServerAPI.ViewModels;
using ServerAPI.ViewModels.Workout;
using System.Threading;

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
            ILogger<WorkoutController> logger,
            IScheduleService scheduleService)
        {
            _workoutService = workoutService;
            _logger = logger;
            _scheduleService = scheduleService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateWorkout([FromBody] WorkoutCreateModel workoutDto)
        {
            var createdWorkout = await _workoutService.CreateWorkoutAsync(workoutDto);
            return CreatedAtAction(nameof(GetWorkout), new { id = createdWorkout.Id }, createdWorkout);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateWorkout(string id, [FromBody] WorkoutUpdateModel workoutDto)
        {
            var updatedWorkout = await _workoutService.UpdateWorkoutAsync(id, workoutDto);
            return Ok(updatedWorkout);
        }

        [HttpDelete("delete-workout/{id}")]
        public async Task<IActionResult> DeleteWorkout(string id)
        {
            if (string.IsNullOrEmpty(id))
            {
                return BadRequest(new { message = "Workout ID cannot be null or empty." });
            }

            await _workoutService.DeleteWorkoutAsync(id);
            return NoContent();
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetWorkout(string id)
        {
            var workout = await _scheduleService.GetWorkoutByIdAsync(id);
            return Ok(workout);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllWorkouts(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] bool? upcomingOnly = null,
            [FromQuery] string search = null,
            [FromQuery] string status = null,
            CancellationToken cancellationToken = default)
        {
            var workouts = await _workoutService.GetWorkoutsPagedAsync(
                page,
                pageSize,
                upcomingOnly,
                search,
                status,
                cancellationToken);
            _logger.LogInformation("Retrieved {Count} of {TotalCount} workouts (page {Page})", workouts.Items.Count, workouts.TotalCount, workouts.Page);
            return Ok(workouts);
        }

        [HttpPost("{id}/duplicate")]
        public async Task<IActionResult> DuplicateWorkout(string id, [FromBody] DuplicateWorkoutRequest request = null)
        {
            var duplicated = await _workoutService.DuplicateWorkoutAsync(id, request);
            return CreatedAtAction(nameof(GetWorkout), new { id = duplicated.Id }, duplicated);
        }

        [HttpPost("batch")]
        public async Task<IActionResult> CreateWorkoutsBatch([FromBody] BatchCreateWorkoutsRequest request)
        {
            var result = await _workoutService.CreateWorkoutsBatchAsync(request);
            return Ok(result);
        }
    }
}