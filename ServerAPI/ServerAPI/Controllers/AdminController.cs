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

    [Authorize(Roles = "Administrator")]            
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly JumpWithJennyDbContext _context;
        private readonly IUserService _userService;
        
        public AdminController(JumpWithJennyDbContext context, IUserService userService)
        {
            _context = context;
            _userService = userService;
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
    }
}