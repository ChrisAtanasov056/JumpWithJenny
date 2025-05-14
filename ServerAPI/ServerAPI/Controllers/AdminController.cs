namespace ServerAPI.Controllers
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;
    using ServerAPI.Data;
    using ServerAPI.Services.Users;
    using ServerAPI.ViewModels.Users;
    using System.Threading.Tasks;
    using System.Linq;
    using Microsoft.EntityFrameworkCore;
    using ServerAPI.Models;
    using ServerAPI.Services.Workouts;
    using ServerAPI.Models.Schedule;
    using ServerAPI.Services.Schedule;

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
    }
}