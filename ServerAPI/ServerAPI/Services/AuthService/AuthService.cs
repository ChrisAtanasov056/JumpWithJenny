

namespace ServerAPI.Services.AuthService
{
    using System.Collections.Concurrent;
    using System.Net;
    using System.Security.Cryptography;
    using global::ServerAPI.Common;
    using global::ServerAPI.Data;
    using global::ServerAPI.Models;
    using global::ServerAPI.Models.Authentication;
    using Microsoft.AspNetCore.Identity;
    using Microsoft.EntityFrameworkCore;
    using Newtonsoft.Json;
    public class AuthService : IAuthService
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;

        private readonly JumpWithJennyDbContext _dbContext;
        private readonly JwtTokenService _jwtTokenService;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        private readonly ILogger<AuthService> _logger;

        private readonly IEmailTemplateService _emailTemplateService;


       private readonly ConcurrentDictionary<string, DateTime> _recentResetRequests = new();
       private readonly TimeSpan _resetRequestCooldown = TimeSpan.FromMinutes(1);

        public AuthService(
            UserManager<User> userManager,
            SignInManager<User> signInManager,
            JwtTokenService jwtTokenService,
            IEmailService emailService,
            IConfiguration configuration,
            JumpWithJennyDbContext dbContext,
            ILogger<AuthService> logger,
            IEmailTemplateService emailTemplateService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _jwtTokenService = jwtTokenService;
            _emailService = emailService;
            _configuration = configuration;
            _dbContext = dbContext;
            _logger = logger;
            _emailTemplateService = emailTemplateService;
        }

        public async Task<AuthResult> LoginAsync(LoginModel model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                return new AuthResult
                {
                    Success = false,
                    Errors = new[] { "Invalid email or password" }
                };
            }

            var result = await _signInManager.PasswordSignInAsync(user.UserName, model.Password, false, false);
            if (!result.Succeeded)
            {
                return new AuthResult
                {
                    Success = false,
                    Errors = new[] { "Invalid email or password" }
                };
            }

            var roles = await _userManager.GetRolesAsync(user);
            var jwtToken = _jwtTokenService.GenerateJwtToken(user, roles);
            
            // Check if a refresh token already exists for the user
            var existingRefreshToken = await _dbContext.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.UserId == user.Id);
            
            _logger.LogInformation($"Existing refresh token: {existingRefreshToken?.Token}");
            RefreshToken refreshToken;
            if (existingRefreshToken != null)
            {
                // Revoke the old refresh token if it exists
                existingRefreshToken.Revoked = DateTime.UtcNow;
                _dbContext.RefreshTokens.Update(existingRefreshToken);
                refreshToken = GenerateRefreshToken();
                refreshToken.UserId = user.Id;
                _dbContext.RefreshTokens.Add(refreshToken);
            }
            else
            {
                // Generate a new refresh token if none exists
                refreshToken = GenerateRefreshToken();
                refreshToken.UserId = user.Id;
                _dbContext.RefreshTokens.Add(refreshToken);
            }
            await _dbContext.SaveChangesAsync();

            return new AuthResult
            {
                Success = true,
                User = MapToUserDto(user, roles.FirstOrDefault()),
                Token = jwtToken,
                RefreshToken = refreshToken.Token,
            };
        }
        public async Task<AuthResult> SignUpAsync(SignUpModel model)
        {
            var user = new User
            {
                UserName = model.UserName,
                Email = model.Email,
                FirstName = model.FirstName,
                LastName = model.LastName,
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
            {
                return new AuthResult
                {
                    Success = false,
                    Errors = result.Errors.Select(e => e.Description)
                };
            }

            // Assign User role
            var roleResult = await _userManager.AddToRoleAsync(user, GlobalConstants.UserRoleName);
            if (!roleResult.Succeeded)
            {
                await _userManager.DeleteAsync(user);
                return new AuthResult
                {
                    Success = false,
                    Errors = roleResult.Errors.Select(e => e.Description)
                };
            }

            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                var frontendUrl = _configuration["FrontendBaseUrl"];
                var websiteUrl = _configuration["WebsiteUrl"] ?? frontendUrl;
                var contactUrl = $"{websiteUrl}/contact";
                
                // Default to English if no language specified or if invalid
                var language = IsValidLanguage(model.Language) ? model.Language : "en";

                var verificationLink = $"{frontendUrl}/verify-email?userId={user.Id}&token={WebUtility.UrlEncode(token)}";

                // Load email template
                var emailContent = await PrepareEmailContent(language, "VerifyEmail", new
                {
                    Link = verificationLink,
                    WebsiteUrl = websiteUrl,
                    ContactUrl = contactUrl,
                    FirstName = user.FirstName // Added first name for personalization
                });

                var emailSent = await _emailService.SendEmailAsync(
                    user.Email, 
                    emailContent.Subject, 
                    emailContent.HtmlContent);

                _logger.LogInformation($"Verification email sent to {user.Email} in language {language}");

            if (!emailSent)
            {
                return new AuthResult
                {
                    Success = false,
                    Errors = new[] { "Error sending verification email." }
                };
            }

            var roles = await _userManager.GetRolesAsync(user);
            var jwtToken = _jwtTokenService.GenerateJwtToken(user, roles);
            
            // Check if a refresh token already exists for the user
            var existingRefreshToken = await _dbContext.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.UserId == user.Id);
            
            RefreshToken refreshToken;
            if (existingRefreshToken != null)
            {
                // Revoke the old refresh token if it exists
                existingRefreshToken.Revoked = DateTime.UtcNow;
                _dbContext.RefreshTokens.Update(existingRefreshToken);
                refreshToken = GenerateRefreshToken();
                refreshToken.UserId = user.Id;
                _dbContext.RefreshTokens.Add(refreshToken);
            }
            else
            {
                // Generate a new refresh token if none exists
                refreshToken = GenerateRefreshToken();
                refreshToken.UserId = user.Id;
                _dbContext.RefreshTokens.Add(refreshToken);
            }

            await _dbContext.SaveChangesAsync();

            return new AuthResult
            {
                Success = true,
                Token = jwtToken,
                RefreshToken = refreshToken.Token,
                User = MapToUserDto(user, roles.FirstOrDefault())
            };
        }

        public async Task<AuthResult> ConfirmEmailAsync(ConfirmEmailRequest request)
        {
            try
            {
                _logger.LogInformation($"Confirming email for user {request.UserId} with token {request.Token}");
                if (string.IsNullOrWhiteSpace(request.UserId) || string.IsNullOrWhiteSpace(request.Token))
                {
                    return new AuthResult
                    {
                        Success = false,
                        Errors = new[] { "User ID and token are required." }
                    };
                }
                var user = await _userManager.FindByIdAsync(request.UserId);
                if (user == null)
                {
                    return new AuthResult
                    {
                        Success = false,
                        Errors = new[] { "User not found." }
                    };
                }

                var result = await _userManager.ConfirmEmailAsync(user, request.Token);
                if (!result.Succeeded)
                {
                    return new AuthResult
                    {
                        Success = false,
                        Errors = new[] { "Invalid token." }
                    };
                }

                // Refresh user data
                user = await _userManager.FindByIdAsync(request.UserId);
                var roles = await _userManager.GetRolesAsync(user);

                return new AuthResult
                {
                    Success = true,
                    User = MapToUserDto(user, roles.FirstOrDefault())
                };
            }
            catch (FormatException)
            {
                return new AuthResult
                {
                    Success = false,
                    Errors = new[] { "Invalid token format." }
                };
            }
            catch (Exception ex)
            {
                return new AuthResult
                {
                    Success = false,
                    Errors = new[] { "An error occurred while confirming email." }
                };
            }
        }

        public async Task<AuthResult> VerifyEmailStatusAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return new AuthResult
                {
                    Success = false,
                    Errors = new[] { "User not found." }
                };
            }

            var roles = await _userManager.GetRolesAsync(user);

            return new AuthResult
            {
                Success = true,
                User = MapToUserDto(user, roles.FirstOrDefault())
            };
        }


        public async Task<AuthResult> ForgotPasswordAsync(ForgotPasswordRequest request)
        {
          
            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return new AuthResult { Success = false, Errors = new[] { "Email is required." } };
            }

            // Check for recent duplicate request
            if (_recentResetRequests.TryGetValue(request.Email, out var lastRequestTime) && 
                DateTime.UtcNow - lastRequestTime < _resetRequestCooldown)
            {
                _logger.LogWarning($"Password reset requested too soon for {request.Email}");
                return new AuthResult { Success = true }; // Return success for security
            }

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                // For security, return success even if user doesn't exist
                return new AuthResult { Success = true };
            }

            try
            {
                // Record this request
                _recentResetRequests[request.Email] = DateTime.UtcNow;
                
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var encodedToken = System.Web.HttpUtility.UrlEncode(token);
                _logger.LogInformation($"Generated password reset token for {request.Email}: {encodedToken}");
                var frontendUrl = _configuration["FrontendBaseUrl"];
                var websiteUrl = _configuration["WebsiteUrl"] ?? frontendUrl;
                var contactUrl = $"{websiteUrl}/contact";
                
                // Default to English if no language specified or if invalid
                var language = IsValidLanguage(request.Language) ? request.Language : "en";

                var resetLink = $"{frontendUrl}/reset-password?token={WebUtility.UrlEncode(encodedToken)}&email={WebUtility.UrlEncode(request.Email)}";

                // Load email template
                var emailContent = await PrepareEmailContent(language, "ResetPassword", new
                {
                    Link = resetLink,
                    WebsiteUrl = websiteUrl,
                    ContactUrl = contactUrl,
                    FirstName = user.FirstName // Added user name for personalization
                });

                var emailSent = await _emailService.SendEmailAsync(
                    request.Email, 
                    emailContent.Subject, 
                    emailContent.HtmlContent);

                if (emailSent)
                {
                    _logger.LogInformation($"Password reset email sent to {request.Email} in {language}");
                    return new AuthResult { Success = true };
                }
                
                // Remove the request record if sending failed
                _recentResetRequests.TryRemove(request.Email, out _);
                return new AuthResult { 
                    Success = false, 
                    Errors = new[] { "Error sending password reset email." } 
                };
            }
            catch (Exception ex)
            {
                // Remove the request record if an error occurred
                _recentResetRequests.TryRemove(request.Email, out _);
                _logger.LogError(ex, "Error sending password reset email");
                return new AuthResult { 
                    Success = false, 
                    Errors = new[] { "An error occurred while processing your request." } 
                };
            }
        }


       


        public async Task<AuthResult> ChangePasswordAsync(ResetPasswordRequest request)
        {
            var user = await _userManager.FindByIdAsync(request.Id);
            _logger.LogInformation($"Attempting to change password for user: {user}");
            if (user == null)
            {
                return new AuthResult
                {
                    Success = false,
                    Errors = new[] { "User not found." }
                };
            }

            var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);

            if (!result.Succeeded)
            {
                return new AuthResult
                {
                    Success = false,
                    Errors = result.Errors.Select(e => e.Description)
                };
            }

            return new AuthResult { Success = true };
        }

        public async Task<AuthResult> ResetPasswordAsync(ForgotPasswordResetRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);

            if (user == null)
            {
                return new AuthResult
                {
                    Success = false,
                    Errors = new[] { "User not found." }
                };
            }
            var dercriptedToken = System.Web.HttpUtility.UrlDecode(request.Token);
            var result = await _userManager.ResetPasswordAsync(user, dercriptedToken, request.NewPassword);

            if (!result.Succeeded)
            {
                return new AuthResult
                {
                    Success = false,
                    Errors = result.Errors.Select(e => e.Description)
                };
            }

            return new AuthResult { Success = true };
        }


        public async Task<AuthResult> ResendVerificationEmailAsync(ResendEmailRequest request)
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return new AuthResult { 
                    Success = false, 
                    Errors = new[] { "Email is required." } 
                };
            }

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null || user.EmailConfirmed)
            {
                // Return generic message for security
                return new AuthResult { 
                    Success = false, 
                    Errors = new[] { "Invalid request" } 
                };
            }

            try
            {
                var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                var frontendUrl = _configuration["FrontendBaseUrl"];
                var websiteUrl = _configuration["WebsiteUrl"] ?? frontendUrl;
                var contactUrl = $"{websiteUrl}/contact";
                
                // Default to English if no language specified or if invalid
                var language = IsValidLanguage(request.Language) ? request.Language : "en";
                _logger.LogInformation($"Resending verification email for user {user.Email} in language {language}");
                var verificationLink = $"{frontendUrl}/verify-email?userId={user.Id}&token={WebUtility.UrlEncode(token)}";

                // Load email template
                var emailContent = await PrepareEmailContent(language, "VerifyEmail", new
                {
                    Link = verificationLink,
                    WebsiteUrl = websiteUrl,
                    ContactUrl = contactUrl,
                    FirstName = user.FirstName // Added first name for personalization
                });

                var emailSent = await _emailService.SendEmailAsync(
                    user.Email, 
                    emailContent.Subject, 
                    emailContent.HtmlContent);

                _logger.LogInformation($"Verification email sent to {user.Email} in language {language}");
                
                return emailSent 
                    ? new AuthResult { Success = true }
                    : new AuthResult { 
                        Success = false, 
                        Errors = new[] { "Error sending verification email." } 
                    };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending verification email");
                return new AuthResult { 
                    Success = false, 
                    Errors = new[] { "An error occurred while processing your request." } 
                };
            }
        }

        private UserDto MapToUserDto(User user, string role)
        {
            return new UserDto
            {
                id = user.Id,
                email = user.Email,
                username = user.UserName,
                firstname = user.FirstName,
                lastname = user.LastName,
                emailConfirmed = user.EmailConfirmed,
                role = role
            };
        }

        private static RefreshToken GenerateRefreshToken()
        {
            return new RefreshToken
            {
                Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
                Expires = DateTime.UtcNow.AddDays(7),
                Revoked = null
            };
        }
        
      public async Task<AuthResult> RefreshTokenAsync(string token)
        {
            _logger.LogInformation($"Received token: {token}");

            using (var transaction = await _dbContext.Database.BeginTransactionAsync())
            {
                try
                {
                    var storedToken = await _dbContext.RefreshTokens
                        .Include(rt => rt.User)
                        .FirstOrDefaultAsync(x => x.Token == token);

                    if (storedToken == null || !storedToken.IsActive)
                    {
                        return new AuthResult { Success = false, Errors = new[] { "Invalid refresh token." } };
                    }

                    if (storedToken.Locked)
                    {
                        return new AuthResult { Success = false, Errors = new[] { "Refresh token is already being processed." } };
                    }

                    // Lock token during processing
                    storedToken.Locked = true;
                    await _dbContext.SaveChangesAsync();

                    var user = storedToken.User;
                    var roles = await _userManager.GetRolesAsync(user);

                    // Generate new JWT
                    var newJwt = _jwtTokenService.GenerateJwtToken(user, roles);

                    string refreshTokenToReturn = storedToken.Token;

                    // Decide whether to rotate refresh token
                    bool shouldRotate = storedToken.Expires - DateTime.UtcNow < TimeSpan.FromDays(1);
                    if (shouldRotate)
                    {
                        var newRefreshToken = GenerateRefreshToken();
                        newRefreshToken.UserId = user.Id;

                        // Revoke old token
                        storedToken.Revoked = DateTime.UtcNow;

                        // Add new one
                        _dbContext.RefreshTokens.Add(newRefreshToken);
                        refreshTokenToReturn = newRefreshToken.Token;
                    }

                    await _dbContext.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return new AuthResult
                    {
                        Success = true,
                        Token = newJwt,
                        RefreshToken = refreshTokenToReturn,
                        User = MapToUserDto(user, roles.FirstOrDefault())
                    };
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Error during refresh token process: {ex.Message}");
                    await transaction.RollbackAsync();
                    return new AuthResult { Success = false, Errors = new[] { "An error occurred while refreshing the token." } };
                }
                finally
                {
                    var storedToken = await _dbContext.RefreshTokens.FirstOrDefaultAsync(x => x.Token == token);
                    if (storedToken != null)
                    {
                        storedToken.Locked = false;
                        await _dbContext.SaveChangesAsync();
                    }
                }
            }
        }

         private async Task<EmailContent> PrepareEmailContent(string language, string templateName, dynamic templateData)
        {
            try
            {
                var languageFile = $"emailTexts.{language}.json";
                var jsonContent = await File.ReadAllTextAsync(Path.Combine("Resources", languageFile));
                dynamic emailTexts = JsonConvert.DeserializeObject(jsonContent);
                dynamic templateContent = emailTexts[templateName];

                var emailLayout = await File.ReadAllTextAsync(Path.Combine("Resources", "EmailTemplate.html"));
                
                var resetButton = $@"<table cellpadding='0' cellspacing='0' border='0' align='center'>
                                <tr><td align='center'>
                                    <a href='{templateData.Link}' class='button'>{(string)templateContent.ButtonText}</a>
                                </td></tr></table>";

                var bodyContent = $@"
                    <h1>{(string)templateContent.Heading}</h1>
                    <p>{(string)templateContent.Greeting}, {templateData.FirstName}</p>
                    <p>{(string)templateContent.Instructions}</p>
                    {resetButton}
                    <p><small>{(string)templateContent.ExpiryNote}</small></p>
                    <p><small>{(string)templateContent.NoRequestNote}</small></p>
                    <p>{(string)templateContent.Signature}</p>";

                string finalEmailHtml = emailLayout
                    .Replace("{{lang}}", language)
                    .Replace("{{subject}}", (string)templateContent.Subject)
                    .Replace("{{bodyContent}}", bodyContent)
                    .Replace("{{websiteUrl}}", templateData.WebsiteUrl)
                    .Replace("{{contactUrl}}", templateData.ContactUrl)
                    .Replace("{{currentYear}}", DateTime.Now.Year.ToString())
                    .Replace("{{allRightsReserved}}", (string)templateContent.AllRightsReserved)
                    .Replace("{{contactUs}}", (string)templateContent.ContactUs);

                return new EmailContent
                {
                    Subject = (string)templateContent.Subject,
                    HtmlContent = finalEmailHtml
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to prepare email content for {language}");
                throw;
            }
        }

        private string BuildVerificationEmail(string firstName, string verificationLink)
        {
            return $@"
                <html>
                    <body style='font-family: Arial, sans-serif; line-height: 1.6;'>
                        <div style='background-color: #f4f4f4; padding: 30px;'>
                            <div style='background-color: #ffffff; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);'>
                                <h2 style='color: #4CAF50;'>Welcome to JumpWithJenny, {firstName}!</h2>
                                <p style='color: #333;'>We're excited to have you on board. To complete your registration, please verify your email address by clicking the button below:</p>
                                <a href='{verificationLink}' style='background-color: #4CAF50; padding: 14px 20px; color: white; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px; font-size: 16px;'>Verify Your Email</a>
                                <hr style='margin-top: 30px; border: 0; border-top: 1px solid #ddd;' />
                                <p style='color: #555;'>Thank you for joining us! If you have any questions or need support, feel free to contact our team.</p>
                                <p style='color: #888;'>Best regards,<br />The JumpWithJenny Team</p>
                            </div>
                        </div>
                    </body>
                </html>";
        }

        private string BuildPasswordResetEmail(string resetLink)
        {
            return $@"
                <div style='font-family: Arial, sans-serif; background-color: #ffffff; padding: 20px;'>
                    <div style='max-width: 500px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;'>
                        <h2 style='color: #333; text-align: center;'>Password Reset Request</h2>
                        <p style='font-size: 16px; color: #555;'>
                            You recently requested to reset your password. Click the button below to proceed:
                        </p>
                        <div style='text-align: center; margin: 20px 0;'>
                            <a href='{resetLink}' style='background-color: #E74C3C; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-size: 16px; display: inline-block;'>
                                Reset Password
                            </a>
                        </div>
                        <p style='font-size: 14px; color: #666;'>
                            If you didn't request this, you can safely ignore this email. The link will expire in 24 hours.
                        </p>
                        <p style='font-size: 12px; color: #888;'>
                            If you have any questions, please contact us.
                        </p>
                    </div>
                </div>";
        }
          private bool IsValidLanguage(string language)
        {
            var supportedLanguages = new[] { "en", "bg" };
            return !string.IsNullOrWhiteSpace(language) && supportedLanguages.Contains(language);
        }
    }
    
    internal class EmailContent
    {
        public string Subject { get; set; }
        public string HtmlContent { get; set; }
    }


      
}