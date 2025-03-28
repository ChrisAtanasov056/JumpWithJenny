namespace ServerAPI.Controllers
{
    using Microsoft.AspNetCore.Cors;
    using Microsoft.AspNetCore.Mvc;
    using ServerAPI.Services.Users;
    using ServerAPI.ViewModels.Users;

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
        [HttpGet("all")]
        public async Task<IActionResult> All()
        {
            var users = new AllUsersViewModels
            {
                Users = await this.userService.GetAllUsersAsync<UserViewModel>()
            };
            return Ok(users);
        }
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

            var result = await this.userService.ChangePasswordAsync(model.Id, model.CurrentPassword, model.NewPassword);
            if (!result)
            {
                return BadRequest("Password change failed. Please ensure the current password is correct.");
            }

            return Ok("Password changed successfully.");
        }
        // POST <UserController>
        [HttpPost]
        public void Post([FromBody] string value)
        {
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var result = await this.userService.DeleteUserAsync(id);
            if (!result)
            {
                return NotFound("User not found or could not be deleted.");
            }

            return Ok("User deleted successfully.");
        }
    }
}
