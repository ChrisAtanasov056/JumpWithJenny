using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServerAPI.Data;
using ServerAPI.Services.Users;
using ServerAPI.ViewModels.Users;
using ServerAPI.Services.Workouts;
using ServerAPI.Services.Schedule;
using ServerAPI.Models.Schedule;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace ServerAPI.Controllers
{
    [Authorize(Roles = "Administrator")]            
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly JumpWithJennyDbContext _context;
        private readonly IUserService _userService;
        private readonly IWorkoutServices _workoutService;
        private readonly ILogger<WorkoutController> _logger;
        private readonly IScheduleService _scheduleService;
        
        public AdminController(JumpWithJennyDbContext context, 
        IUserService userService, 
        IWorkoutServices workoutService, 
        ILogger<WorkoutController> logger,
        IScheduleService scheduleService)
        {
            _context = context;
            _userService = userService;
            _workoutService = workoutService;
            _logger = logger;
            _scheduleService = scheduleService;
        }

        // POST: api/admin/users
        [HttpPost("users/create")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> CreateUser([FromBody] UserCreateViewModel userModel)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var result = await _userService.CreateUserAsync(userModel);
                if (result.Succeeded)
                {
                    return Ok(new { Message = "User created successfully." });
                }
                
                return BadRequest(new { Message = "User creation failed.", Errors = result.Errors });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while creating the user.", Error = ex.Message });
            }
        }

        // GET: api/admin/users
        [HttpGet("users")]
        public async Task<IActionResult> All()
        {
            var users = new AllUsersViewModels
            {
                Users = await _userService.GetAllUsersAsync<UserViewModel>()
            };
            return Ok(users);
        }

        // GET: api/admin/users/{id}
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            if (string.IsNullOrEmpty(id))
            {
                return BadRequest(new { Message = "User ID cannot be null or empty" });
            }
            var results = _userService.DeleteUserAsync(id);
            if (!results.Result)
            {
                return BadRequest(new { Message = "User deletion failed" });
            }
            
            return Ok(new { Message = "User deleted successfully" });
        }
        
        // GET: api/admin/workouts
        [AllowAnonymous]
        [HttpGet("workouts/{id}")]
        public async Task<IActionResult> GetWorkout(string id)
        {
             _logger.LogInformation("IsAuthenticated: {auth}", User.Identity.IsAuthenticated);
             _logger.LogInformation("Roles: {roles}", string.Join(", ", User.Claims));
            try
            {
                var workout = await _workoutService.GetWorkoutByIdAsync(id);
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

        // POST: /api/workout/add/participant
        [HttpPost("add/participant")]
        [AllowAnonymous]
       public async Task<IActionResult> AddParticipantToWorkout(string id, [FromBody] ApplyForWorkoutRequest request)
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
                    return BadRequest("Could not add participant (maybe no available spots or no available shoes).");
                }

                _logger.LogInformation("Participant added to workout {WorkoutId}", request.WorkoutId);
                return Ok(updatedWorkout);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred: " + ex.Message);
            }
        }

        [HttpDelete("remove/participant")]
        [AllowAnonymous]
        public async Task<IActionResult> RemoveParticipantFromWorkout([FromQuery] string workoutId, [FromQuery] string userId)
        {
            if (string.IsNullOrEmpty(workoutId) || string.IsNullOrEmpty(userId))
            {
                return BadRequest("Workout ID and User ID must be provided.");
            }

            try
            {
                var success = await _scheduleService.CancelRegistrationAsync(workoutId, userId);

                if (!success)
                {
                    return BadRequest("Failed to remove participant from the workout.");
                }

                _logger.LogInformation("Participant {UserId} removed from workout {WorkoutId}", userId, workoutId);
                return Ok(new { Message = "Participant removed successfully." });
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex.Message);
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing participant from workout");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("/api/users/search")]
        [AllowAnonymous]
        public async Task<IActionResult> SearchUsers([FromQuery] string query)
        {
            var results = await _userService.SearchUsersAsync(query);
            return Ok(results);
        }

        [HttpGet("/api/workouts/all")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<AdminWorkoutViewModel>>> GetAllWorkouts()
        {
            var workouts = await _workoutService.GetAllWorkoutsAsync();
            return Ok(workouts);
        }
    }
}