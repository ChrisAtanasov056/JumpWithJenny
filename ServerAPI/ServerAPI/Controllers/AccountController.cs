namespace ServerAPI.Controllers
{
    using System.Security.Claims;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Cors;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.AspNetCore.RateLimiting;
    using ServerAPI.Models.Authentication;

    [Route("/[controller]")]
    [EnableCors("AllowOrigin")]
    [EnableRateLimiting("AuthPolicy")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AccountController> _logger;

        public AccountController(IAuthService authService, ILogger<AccountController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.LoginAsync(model);

            if (!result.Success)
            {
                return Unauthorized(new { errors = result.Errors });
            }

            if (result.User == null)
            {
                return NotFound(new { message = "User not found." });
            }

            return Ok(new { token = result.Token, user = result.User, refreshToken = result.RefreshToken });
        }

        [EnableRateLimiting("EmailPolicy")]
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            var result = await _authService.ForgotPasswordAsync(request);

            if (!result.Success)
            {
                return StatusCode(500, new { errors = result.Errors });
            }

            return Ok();
        }

        [Authorize]
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized();
            }

            if (!string.IsNullOrEmpty(request.Id) && request.Id != currentUserId)
            {
                return Forbid();
            }

            request.Id = currentUserId;
            var result = await _authService.ChangePasswordAsync(request);

            if (!result.Success)
            {
                return BadRequest(new { errors = result.Errors });
            }

            return Ok();
        }

        [HttpPost("reset-password-token")]
        public async Task<IActionResult> ResetPasswordWithToken([FromBody] ForgotPasswordResetRequest request)
        {
            var result = await _authService.ResetPasswordAsync(request);

            if (!result.Success)
            {
                return BadRequest(new { errors = result.Errors });
            }

            return Ok(new { message = "Password reset successful." });
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
        {
            if (string.IsNullOrEmpty(request.RefreshToken))
            {
                return BadRequest(new { message = "Refresh token is required." });
            }

            var result = await _authService.RefreshTokenAsync(request.RefreshToken);

            if (!result.Success)
            {
                return Unauthorized(result);
            }

            return Ok(new
            {
                accessToken = result.Token,
                refreshToken = result.RefreshToken,
                user = result.User
            });
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request = null)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var refreshToken = request?.RefreshToken;

            if (string.IsNullOrWhiteSpace(refreshToken) && string.IsNullOrWhiteSpace(currentUserId))
            {
                return Ok(new { message = "Logged out." });
            }

            await _authService.LogoutAsync(refreshToken, currentUserId);
            return Ok(new { message = "Logged out successfully." });
        }
    }
}
