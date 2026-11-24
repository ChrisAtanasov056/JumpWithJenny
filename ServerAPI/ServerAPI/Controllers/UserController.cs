namespace ServerAPI.Controllers
{
    using System.Security.Claims;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Cors;
    using Microsoft.AspNetCore.Mvc;
    using ServerAPI.Common;
    using ServerAPI.Services.Users;
    using ServerAPI.ViewModels.Users;

    [Authorize]
    [Route("/[controller]")]
    [EnableCors("AllowOrigin")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserService userService;

        public UserController(IUserService userService)
        {
            this.userService = userService;
        }

        [Authorize(Roles = GlobalConstants.AdministratorRoleName)]
        [HttpGet("all")]
        public async Task<IActionResult> All()
        {
            var users = new AllUsersViewModels
            {
                Users = await this.userService.GetAllUsersAsync<UserViewModel>()
            };
            return Ok(users);
        }

        [Authorize(Roles = GlobalConstants.AdministratorRoleName)]
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(string id)
        {
            var user = await this.userService.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound();
            }
            return Ok(user);
        }

        // PUT api/<UserController>/change-password
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized();
            }

            if (!string.IsNullOrEmpty(model.Id) && model.Id != currentUserId)
            {
                return Forbid();
            }

            var result = await this.userService.ChangePasswordAsync(currentUserId, model.CurrentPassword, model.NewPassword);
            if (!result)
            {
                return BadRequest("Password change failed. Please ensure the current password is correct.");
            }

            return Ok("Password changed successfully.");
        }

        [Authorize(Roles = GlobalConstants.AdministratorRoleName)]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UserUpdateViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            try
            {
                var updatedUser = await this.userService.UpdateUserAsync(id, model, currentUserId);
                return Ok(updatedUser);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Roles = GlobalConstants.AdministratorRoleName)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(currentUserId) && currentUserId == id)
            {
                return BadRequest(new { message = "You cannot delete your own account." });
            }

            try
            {
                var result = await this.userService.DeleteUserAsync(id);
                if (!result)
                {
                    return NotFound(new { message = "User not found or could not be deleted." });
                }

                return Ok(new { message = "User deleted successfully." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
