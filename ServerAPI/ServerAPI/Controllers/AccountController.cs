namespace ServerAPI.Controllers{

    using Microsoft.AspNetCore.Cors;
    using Microsoft.AspNetCore.Mvc;
    using ServerAPI.Models;
    using ServerAPI.Models.Authentication;

    [Route("/[controller]")]
    [EnableCors("AllowOrigin")]
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

        [HttpPost("signup")]
        public async Task<IActionResult> SignUp([FromBody] SignUpModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.SignUpAsync(model);
            
            if (!result.Success)
            {
                return BadRequest(new { errors = result.Errors });
            }

            return Ok(new { token = result.Token, user = result.User , refreshToken = result.RefreshToken });
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

            return Ok(new { token = result.Token, user = result.User , refreshToken = result.RefreshToken });
        }

        [HttpPost("confirmemail")]
        public async Task<IActionResult> ConfirmEmail([FromBody] ConfirmEmailRequest request)
        {
            var result = await _authService.ConfirmEmailAsync(request);
            
            if (!result.Success)
            {
                return BadRequest(new { errors = result.Errors });
            }

            return Ok(new { message = "Email confirmed successfully.", user = result.User });
        }

        [HttpGet("verifyEmailStatus")]
        public async Task<IActionResult> VerifyEmailStatus(string userId)
        {
            var result = await _authService.VerifyEmailStatusAsync(userId);
            
            if (!result.Success)
            {
                return BadRequest(new { errors = result.Errors });
            }

            return Ok(new { user = result.User });
        }

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

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            var result = await _authService.ResetPasswordAsync(request);
            
            if (!result.Success)
            {
                return BadRequest(new { errors = result.Errors });
            }

            return Ok();
        }
        
        [HttpPost("refresh-token")]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
        {
            if (string.IsNullOrEmpty(request.RefreshToken))
                return BadRequest(new { message = "Refresh token is required." });

            var result = await _authService.RefreshTokenAsync(request.RefreshToken);

            if (!result.Success)
                return Unauthorized(result);

            return Ok(new
            {
                accessToken = result.Token,
                refreshToken = result.RefreshToken,
                user = result.User
            });
        }
        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerificationEmail([FromBody] ResendEmailRequest request)
        {
            var result = await _authService.ResendVerificationEmailAsync(request);
            
            if (!result.Success)
            {
                return BadRequest(new { errors = result.Errors });
            }

            return Ok(new { message = "Verification email sent!" });
        }
    }
}
