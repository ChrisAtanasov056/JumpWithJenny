// ServerAPI.Controllers.AuthController.cs

using Microsoft.AspNetCore.Mvc;
using ServerAPI.Models.Authentication;
using ServerAPI.Services.AuthService;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IGoogleAuthService _googleAuthService;
    private readonly IFacebookAuthService _facebookAuthService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IGoogleAuthService googleAuthService, IFacebookAuthService facebookAuthService, ILogger<AuthController> logger)
    {
        _googleAuthService = googleAuthService;
        _facebookAuthService = facebookAuthService; 
        _logger = logger;
    }

    [HttpPost("google-login")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleAuthCodeRequest request)
    {
        try
        {
            _logger.LogInformation("Received Google login request with authorization code.");
            var tokenResult = await _googleAuthService.ExchangeCodeForTokensAsync(request.Code);
            if (!tokenResult.Success)
            {
                _logger.LogWarning("Failed to exchange code for tokens: {Errors}", string.Join(", ", tokenResult.Errors));
                return BadRequest(new { errors = tokenResult.Errors });
            }
            var authResult = await _googleAuthService.ExternalLoginAsync(tokenResult.IdToken);
            if (!authResult.Success)
            {
                _logger.LogWarning("Google external login failed: {Errors}", string.Join(", ", authResult.Errors));
                return BadRequest(new { errors = authResult.Errors });
            }
            _logger.LogInformation("Successful Google login for user: {Email}", authResult.User?.email);
            return Ok(authResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred during Google login.");
            return StatusCode(500, new { message = "An internal error occurred." });
        }
    }
    
    [HttpPost("facebook-login")]
    public async Task<IActionResult> FacebookLogin([FromBody] FacebookAuthCodeRequest request)
    {
        try
        {
            _logger.LogInformation("Received Facebook login request with access token.");

            var authResult = await _facebookAuthService.ExternalLoginAsync(request.AccessToken);

            if (!authResult.Success)
            {
                _logger.LogWarning("Facebook external login failed: {Errors}", string.Join(", ", authResult.Errors));
                return BadRequest(new { errors = authResult.Errors });
            }
            return Ok(authResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred during Facebook login.");
            return StatusCode(500, new { message = "An internal error occurred." });
        }
    }
}