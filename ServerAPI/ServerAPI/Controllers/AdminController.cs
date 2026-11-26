using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServerAPI.Common;
using ServerAPI.Models.Admin;
using ServerAPI.Models.Schedule;
using ServerAPI.Services.Admin;
using ServerAPI.Services.Schedule;
using ServerAPI.Services.Users;
using ServerAPI.Services.Workouts;
using ServerAPI.ViewModels.Users;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace ServerAPI.Controllers
{
    [Authorize(Roles = GlobalConstants.AdministratorRoleName)]
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IWorkoutServices _workoutService;
        private readonly ILogger<AdminController> _logger;
        private readonly IScheduleService _scheduleService;
        private readonly IAdminInsightsService _adminInsightsService;

        public AdminController(
            IUserService userService,
            IWorkoutServices workoutService,
            ILogger<AdminController> logger,
            IScheduleService scheduleService,
            IAdminInsightsService adminInsightsService)
        {
            _userService = userService;
            _workoutService = workoutService;
            _logger = logger;
            _scheduleService = scheduleService;
            _adminInsightsService = adminInsightsService;
        }

        // GET: api/admin/dashboard
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken = default)
        {
            var dashboard = await _adminInsightsService.GetDashboardAsync(cancellationToken);
            return Ok(dashboard);
        }

        // GET: api/admin/clients
        [HttpGet("clients")]
        public async Task<IActionResult> GetClients(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25,
            [FromQuery] string search = null,
            [FromQuery] string sortBy = "lastVisit",
            CancellationToken cancellationToken = default)
        {
            var clients = await _adminInsightsService.GetClientsPagedAsync(page, pageSize, search, sortBy, cancellationToken);
            return Ok(clients);
        }

        // GET: api/admin/clients/autocomplete
        [HttpGet("clients/autocomplete")]
        public async Task<IActionResult> AutocompleteClients(
            [FromQuery] string query,
            CancellationToken cancellationToken = default)
        {
            var matches = await _adminInsightsService.AutocompleteClientsAsync(query, cancellationToken);
            return Ok(matches);
        }

        // POST: api/admin/users/create
        [HttpPost("users/create")]
        public async Task<IActionResult> CreateUser([FromBody] UserCreateViewModel userModel)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _userService.CreateUserAsync(userModel);
            if (result.Succeeded)
            {
                return Ok(new { Message = "User created successfully." });
            }

            return BadRequest(new { Message = "User creation failed.", Errors = result.Errors });
        }

        // GET: api/admin/users
        [HttpGet("users")]
        public async Task<IActionResult> All(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] string search = null,
            CancellationToken cancellationToken = default)
        {
            var users = await _userService.GetUsersPagedAsync(page, pageSize, search, cancellationToken);
            return Ok(users);
        }

        // DELETE: api/admin/users/{id}
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            if (string.IsNullOrEmpty(id))
            {
                return BadRequest(new { Message = "User ID cannot be null or empty." });
            }

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(currentUserId) && currentUserId == id)
            {
                return BadRequest(new { Message = "You cannot delete your own account." });
            }

            var result = await _userService.DeleteUserAsync(id);
            if (!result)
            {
                return NotFound(new { Message = "User not found or could not be deleted." });
            }

            return Ok(new { Message = "User deleted successfully." });
        }

        // GET: api/admin/workouts/{id}
        [HttpGet("workouts/{id}")]
        public async Task<IActionResult> GetWorkout(string id)
        {
            var workout = await _workoutService.GetWorkoutByIdAsync(id);
            return Ok(workout);
        }

        // GET: api/admin/workouts/{id}/participants
        [HttpGet("workouts/{id}/participants")]
        public async Task<IActionResult> GetWorkoutParticipants(string id)
        {
            var participants = await _workoutService.GetParticipantsAsync(id);
            return Ok(participants);
        }

        // POST: /api/Admin/add/participant
        [HttpPost("add/participant")]
        public async Task<IActionResult> AddParticipantToWorkout([FromQuery] string id = null, [FromBody] AdminAddParticipantRequest request = null)
        {
            if (request == null)
            {
                return BadRequest(new { code = "INVALID_REQUEST", message = "Request body is required." });
            }

            var workoutId = !string.IsNullOrWhiteSpace(request.WorkoutId) ? request.WorkoutId : id;
            var applyRequest = new ApplyForWorkoutRequest
            {
                WorkoutId = workoutId,
                FullName = request.FullName,
                Email = request.Email,
                PhoneNumber = request.PhoneNumber,
                ShoeSize = request.ShoeSize,
                UsesOwnShoes = request.UsesOwnShoes,
                Language = string.IsNullOrWhiteSpace(request.Language) ? "bg" : request.Language,
            };

            await _scheduleService.ApplyForWorkoutAsync(
                applyRequest,
                allowPastWorkout: true,
                enforceBookingLimits: false,
                sendConfirmationEmail: request.SendConfirmationEmail && !string.IsNullOrWhiteSpace(request.Email),
                requireEmail: false,
                allowOverbooking: request.AllowOverbooking);

            var adminWorkout = await _workoutService.GetWorkoutByIdAsync(workoutId);
            _logger.LogInformation("Participant {FullName} added to workout {WorkoutId}", request.FullName, workoutId);
            return Ok(adminWorkout);
        }

        // PUT: /api/Admin/participants/{appointmentId}
        [HttpPut("participants/{appointmentId}")]
        public async Task<IActionResult> UpdateParticipant(string appointmentId, [FromBody] AdminUpdateParticipantRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { code = "INVALID_REQUEST", message = "Request body is required." });
            }

            var workoutId = await _scheduleService.UpdateParticipantAsync(appointmentId, request);
            var adminWorkout = await _workoutService.GetWorkoutByIdAsync(workoutId);
            _logger.LogInformation("Participant appointment {AppointmentId} updated in workout {WorkoutId}", appointmentId, workoutId);
            return Ok(adminWorkout);
        }

        // PATCH: /api/Admin/participants/{appointmentId}/attendance
        [HttpPatch("participants/{appointmentId}/attendance")]
        public async Task<IActionResult> SetParticipantAttendance(string appointmentId, [FromBody] SetAttendanceRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { code = "INVALID_REQUEST", message = "Request body is required." });
            }

            await _scheduleService.SetParticipantAttendanceAsync(appointmentId, request.IsAttended);
            _logger.LogInformation("Participant appointment {AppointmentId} attendance set to {IsAttended}", appointmentId, request.IsAttended);
            return Ok(new { Id = appointmentId, IsAttended = request.IsAttended });
        }

        [HttpDelete("remove/participant")]
        public async Task<IActionResult> RemoveParticipantFromWorkout([FromQuery] string appointmentId)
        {
            if (string.IsNullOrWhiteSpace(appointmentId))
            {
                return BadRequest(new { message = "Appointment ID must be provided." });
            }

            var success = await _scheduleService.CancelRegistrationByIdAsync(appointmentId, allowPastWorkout: true);

            if (!success)
            {
                return NotFound(new { code = "BOOKING_NOT_FOUND", message = "Participant registration not found." });
            }

            _logger.LogInformation("Participant appointment {AppointmentId} removed by admin", appointmentId);
            return Ok(new { Message = "Participant removed successfully." });
        }

        [HttpGet("/api/users/search")]
        public async Task<IActionResult> SearchUsers([FromQuery] string query)
        {
            var results = await _userService.SearchUsersAsync(query);
            return Ok(results);
        }

        [HttpGet("/api/workouts/all")]
        public async Task<IActionResult> GetAllWorkouts(
            [FromQuery] int? page = null,
            [FromQuery] int? pageSize = null,
            [FromQuery] bool? upcomingOnly = null,
            [FromQuery] string search = null,
            [FromQuery] string status = null,
            CancellationToken cancellationToken = default)
        {
            if (page.HasValue || pageSize.HasValue)
            {
                var pagedWorkouts = await _workoutService.GetWorkoutsPagedAsync(
                    page ?? 1,
                    pageSize ?? 20,
                    upcomingOnly,
                    search,
                    status,
                    cancellationToken);
                return Ok(pagedWorkouts);
            }

            var result = await _workoutService.GetWorkoutsPagedAsync(
                page: 1,
                pageSize: 100,
                upcomingOnly: upcomingOnly,
                search: search,
                status: status,
                cancellationToken: cancellationToken);
            return Ok(result.Items);
        }
    }
}