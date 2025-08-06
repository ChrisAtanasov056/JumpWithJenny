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
    private readonly ILogger<AuthController> _logger;

    public AuthController(IGoogleAuthService googleAuthService, ILogger<AuthController> logger)
    {
        _googleAuthService = googleAuthService;
        _logger = logger;
    }

    [HttpPost("google-login")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleAuthCodeRequest request)
    {
        try
        {
            _logger.LogInformation("Received Google login request with authorization code.");

            // 1. Обменяме authorization code за tokens от Google
            var tokenResult = await _googleAuthService.ExchangeCodeForTokensAsync(request.Code);

            if (!tokenResult.Success)
            {
                _logger.LogWarning("Failed to exchange code for tokens: {Errors}", string.Join(", ", tokenResult.Errors));
                return BadRequest(new { errors = tokenResult.Errors });
            }

            // 2. Използваме id_token-а, за да валидираме и автентикираме потребителя
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
}