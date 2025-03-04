using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ServerAPI.Models.Authentication;
using ServerAPI.Models;
using ServerAPI.Services;
using Microsoft.Extensions.Configuration;
using System.Web;
using System.Text;

namespace ServerAPI.Controllers
{
    [Route("/[controller]")]
    [EnableCors("AllowOrigin")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly SignInManager<User> _signInManager;
        private readonly UserManager<User> _userManager;
        private readonly JwtTokenService _jwtTokenService;
        private readonly IEmailService _emailService; // Inject IEmailService
        private readonly IConfiguration _configuration; // Inject IConfiguration for access to app settings

        public AccountController(UserManager<User> userManager, SignInManager<User> signInManager, JwtTokenService jwtTokenService, IEmailService emailService, IConfiguration configuration)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _jwtTokenService = jwtTokenService;
            _emailService = emailService; // Initialize email service
            _configuration = configuration; // Initialize configuration
        }

        [HttpPost]
        [Route("signup")]
        public async Task<IActionResult> SignUp([FromBody] SignUpModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var user = new User
                {
                    UserName = model.UserName,
                    Email = model.Email,
                    FirstName = model.FirstName,
                    LastName = model.LastName,
                };

                // Create the user
                var result = await _userManager.CreateAsync(user, model.Password);
                if (!result.Succeeded)
                {
                    foreach (var error in result.Errors)
                    {
                        ModelState.AddModelError(error.Code, error.Description);
                    }
                    return BadRequest(ModelState);
                }

                // Generate the email verification token
                var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                var encodedToken = System.Web.HttpUtility.UrlEncode(token); // Proper encoding

                Console.WriteLine($"Token send: {encodedToken}");

                var frontendUrl = _configuration["FrontendBaseUrl"]; // Set this in your appsettings.json
                var verificationLink = $"{frontendUrl}/verify-email?userId={user.Id}&token={encodedToken}";

                // Updated email body for better design and user experience
                var emailBody = $@"
                    <html>
                        <body style='font-family: Arial, sans-serif; line-height: 1.6;'>
                            <div style='background-color: #f4f4f4; padding: 30px;'>
                                <div style='background-color: #ffffff; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);'>
                                    <h2 style='color: #4CAF50;'>Welcome to JumpWithJenny, {user.FirstName}!</h2>
                                    <p style='color: #333;'>We're excited to have you on board. To complete your registration, please verify your email address by clicking the button below:</p>
                                    <a href='{verificationLink}' style='background-color: #4CAF50; padding: 14px 20px; color: white; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px; font-size: 16px;'>Verify Your Email</a>
                                    <hr style='margin-top: 30px; border: 0; border-top: 1px solid #ddd;' />
                                    <p style='color: #555;'>Thank you for joining us! If you have any questions or need support, feel free to contact our team.</p>
                                    <p style='color: #888;'>Best regards,<br />The JumpWithJenny Team</p>
                                </div>
                            </div>
                        </body>
                    </html>";

                // Send email with verification link
                var emailSent = await _emailService.SendEmailAsync(user.Email, "Verify Your Email", emailBody);

                if (!emailSent)
                {
                    return StatusCode(500, "Error sending verification email.");
                }

                // Generate JWT token
                var jwtToken = _jwtTokenService.GenerateJwtToken(user);

                // Return the token and user data in the response
                return Ok(new
                {
                    token = jwtToken,
                    user = new
                    {
                        id = user.Id,
                        email = user.Email,
                        username = user.UserName,
                        firstname = user.FirstName,
                        lastname = user.LastName,
                        emailVerified = user.EmailConfirmed
                    }
                });
            }
            catch (Exception ex)
            {
                return Problem($"Something Went Wrong in {nameof(SignUp)}", statusCode: 500);
            }
        }

        [HttpPost]
        [Route("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            var result = await _signInManager.PasswordSignInAsync(user.UserName, model.Password, false, false);
            if (!result.Succeeded)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            // Generate token using the injected service
            var token = _jwtTokenService.GenerateJwtToken(user);

            return Ok(new
            {
                token = token,
                user = new
                {
                    id = user.Id,  // Include user ID
                    email = user.Email,
                    username = user.UserName,
                    firstname = user.FirstName,
                    lastname = user.LastName,
                }
            });
        }

    [HttpPost]
    [Route("confirmemail")]
    public async Task<IActionResult> ConfirmEmail([FromBody] ConfirmEmailRequest request)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user == null) return BadRequest("User not found.");

            var result = await _userManager.ConfirmEmailAsync(user, request.Token);
            return result.Succeeded ? Ok("Email confirmed successfully.") : BadRequest("Invalid token.");
        }
        catch (FormatException)
        {
            return BadRequest("Invalid token format.");
        }
    }
    [HttpGet]
    [Route("verifyEmailStatus")]
    public async Task<IActionResult> VerifyEmailStatus(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return BadRequest("User not found.");
        }

        return Ok(new
        {
            isEmailConfirmed = user.EmailConfirmed,
            user = new
            {
                id = user.Id,
                email = user.Email,
                username = user.UserName,
                firstname = user.FirstName,
                lastname = user.LastName
            }
        });
    }
}}