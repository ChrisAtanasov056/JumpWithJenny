

namespace ServerAPI.Services.AuthService
{
    using System.Security.Cryptography;
    using Microsoft.AspNetCore.Identity;
    using Microsoft.EntityFrameworkCore;
    using ServerAPI.Common;
    using ServerAPI.Data;
    using ServerAPI.Models;
    using ServerAPI.Models.Authentication;
    public class AuthService : IAuthService
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;

        private readonly JumpWithJennyDbContext _dbContext;
        private readonly JwtTokenService _jwtTokenService;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        private readonly ILogger<AuthService> _logger;

        public AuthService(
            UserManager<User> userManager,
            SignInManager<User> signInManager,
            JwtTokenService jwtTokenService,
            IEmailService emailService,
            IConfiguration configuration,
            JumpWithJennyDbContext dbContext,
            ILogger<AuthService> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _jwtTokenService = jwtTokenService;
            _emailService = emailService;
            _configuration = configuration;
            _dbContext = dbContext;
            _logger = logger;
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
            var encodedToken = System.Web.HttpUtility.UrlEncode(token);
            var frontendUrl = _configuration["FrontendBaseUrl"];
            var verificationLink = $"{frontendUrl}/verify-email?userId={user.Id}&token={encodedToken}";

            var emailBody = BuildVerificationEmail(user.FirstName, verificationLink);
            var emailSent = await _emailService.SendEmailAsync(user.Email, "Verify Your Email", emailBody);

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
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user != null)
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var encodedToken = System.Web.HttpUtility.UrlEncode(token);
                var frontendUrl = _configuration["FrontendBaseUrl"];
                var resetLink = $"{frontendUrl}/reset-password?token={encodedToken}&email={request.Email}";

                var subject = "Reset Your Password";
                var body = BuildPasswordResetEmail(resetLink);

                var emailSent = await _emailService.SendEmailAsync(request.Email, subject, body);

                if (!emailSent)
                {
                    return new AuthResult
                    {
                        Success = false,
                        Errors = new[] { "Error sending password reset email." }
                    };
                }
            }

            // Always return success to prevent email enumeration
            return new AuthResult { Success = true };
        }

        public async Task<AuthResult> ResetPasswordAsync(ResetPasswordRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                return new AuthResult
                {
                    Success = false,
                    Errors = new[] { "Invalid request" }
                };
            }

            var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
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
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null || user.EmailConfirmed)
            {
                return new AuthResult
                {
                    Success = false,
                    Errors = new[] { "Invalid request" }
                };
            }

            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var encodedToken = System.Web.HttpUtility.UrlEncode(token);
            var frontendUrl = _configuration["FrontendBaseUrl"];
            var verificationLink = $"{frontendUrl}/verify-email?userId={user.Id}&token={encodedToken}";

            var emailBody = BuildVerificationEmail(user.FirstName, verificationLink);
            var emailSent = await _emailService.SendEmailAsync(user.Email, "Verify Your Email", emailBody);

            if (!emailSent)
            {
                return new AuthResult
                {
                    Success = false,
                    Errors = new[] { "Error sending verification email." }
                };
            }

            return new AuthResult { Success = true };
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
    }
}