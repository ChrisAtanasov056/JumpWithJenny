// Services/AuthService/FacebookAuthService.cs
using System;
using System.Linq;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ServerAPI.Common;
using ServerAPI.Data;
using ServerAPI.Models;
using ServerAPI.Models.Authentication;

namespace ServerAPI.Services.AuthService
{
    public class FacebookAuthService : IFacebookAuthService
    {
        private const string ProviderName = "Facebook";

        private readonly HttpClient _httpClient;
        private readonly UserManager<User> _userManager;
        private readonly JumpWithJennyDbContext _dbContext;
        private readonly IConfiguration _configuration;
        private readonly JwtTokenService _jwtTokenService;
        private readonly ILogger<FacebookAuthService> _logger;

        public FacebookAuthService(
            HttpClient httpClient,
            UserManager<User> userManager,
            JumpWithJennyDbContext dbContext,
            IConfiguration configuration,
            JwtTokenService jwtTokenService,
            ILogger<FacebookAuthService> logger)
        {
            _httpClient = httpClient;
            _userManager = userManager;
            _dbContext = dbContext;
            _configuration = configuration;
            _jwtTokenService = jwtTokenService;
            _logger = logger;
        }

        public async Task<AuthResult> ExternalLoginAsync(string accessToken)
        {
            if (string.IsNullOrWhiteSpace(accessToken))
            {
                return new AuthResult
                {
                    Success = false,
                    Errors = new[] { "Facebook access token is required." }
                };
            }

            try
            {
                var appSecret = _configuration["Authentication:Facebook:AppSecret"];
                if (string.IsNullOrWhiteSpace(appSecret))
                {
                    _logger.LogError("Facebook AppSecret is not configured.");
                    return new AuthResult { Success = false, Errors = new[] { "Facebook authentication is not configured." } };
                }

                var appSecretProof = GenerateAppSecretProof(accessToken, appSecret);

                string facebookApiUrl =
                    $"https://graph.facebook.com/v18.0/me?fields=id,name,email,first_name,last_name&access_token={Uri.EscapeDataString(accessToken)}&appsecret_proof={Uri.EscapeDataString(appSecretProof)}";

                var response = await _httpClient.GetAsync(facebookApiUrl);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Facebook Graph API returned HTTP {StatusCode}", (int)response.StatusCode);
                    return new AuthResult { Success = false, Errors = new[] { "Failed to validate Facebook access token." } };
                }

                await using var contentStream = await response.Content.ReadAsStreamAsync();
                var userProfile = await JsonSerializer.DeserializeAsync<FacebookUserProfile>(contentStream);

                if (userProfile == null || string.IsNullOrWhiteSpace(userProfile.Id))
                {
                    return new AuthResult { Success = false, Errors = new[] { "Failed to retrieve user profile from Facebook." } };
                }

                var user = await _userManager.FindByLoginAsync(ProviderName, userProfile.Id);
                if (user != null)
                {
                    if (user.IsDeleted || await _userManager.IsLockedOutAsync(user))
                    {
                        return new AuthResult
                        {
                            Success = false,
                            Errors = new[] { "User account is unavailable or locked." }
                        };
                    }

                    return await GenerateAuthResultForUser(user);
                }

                if (string.IsNullOrWhiteSpace(userProfile.Email))
                {
                    return new AuthResult
                    {
                        Success = false,
                        Errors = new[] { "Facebook account does not provide a verified email address." }
                    };
                }

                user = await _userManager.FindByEmailAsync(userProfile.Email);
                if (user != null)
                {
                    if (user.IsDeleted || await _userManager.IsLockedOutAsync(user))
                    {
                        return new AuthResult
                        {
                            Success = false,
                            Errors = new[] { "User account is unavailable or locked." }
                        };
                    }

                    if (!user.EmailConfirmed)
                    {
                        return new AuthResult
                        {
                            Success = false,
                            Errors = new[] { "An unverified account with this email already exists. Please verify your email or reset your password first." }
                        };
                    }

                    var existingLogins = await _userManager.GetLoginsAsync(user);
                    if (existingLogins.Any(l => l.LoginProvider == ProviderName && l.ProviderKey != userProfile.Id))
                    {
                        return new AuthResult
                        {
                            Success = false,
                            Errors = new[] { "A different Facebook account is already linked to this user." }
                        };
                    }

                    if (!existingLogins.Any(l => l.LoginProvider == ProviderName && l.ProviderKey == userProfile.Id))
                    {
                        var addLoginResult = await _userManager.AddLoginAsync(
                            user,
                            new UserLoginInfo(ProviderName, userProfile.Id, ProviderName));
                        if (!addLoginResult.Succeeded)
                        {
                            return new AuthResult
                            {
                                Success = false,
                                Errors = addLoginResult.Errors.Select(e => e.Description).ToArray()
                            };
                        }
                    }

                    return await GenerateAuthResultForUser(user);
                }

                user = new User
                {
                    UserName = userProfile.Email,
                    Email = userProfile.Email,
                    FirstName = userProfile.FirstName ?? string.Empty,
                    LastName = userProfile.LastName ?? string.Empty,
                    EmailConfirmed = true,
                    IsExternalLogin = true,
                    ProviderName = ProviderName,
                    ProviderId = userProfile.Id
                };

                var createResult = await _userManager.CreateAsync(user);
                if (!createResult.Succeeded)
                {
                    return new AuthResult
                    {
                        Success = false,
                        Errors = createResult.Errors.Select(e => e.Description).ToArray()
                    };
                }

                var roleResult = await _userManager.AddToRoleAsync(user, GlobalConstants.UserRoleName);
                if (!roleResult.Succeeded)
                {
                    await _userManager.DeleteAsync(user);
                    return new AuthResult
                    {
                        Success = false,
                        Errors = roleResult.Errors.Select(e => e.Description).ToArray()
                    };
                }

                var loginResult = await _userManager.AddLoginAsync(
                    user,
                    new UserLoginInfo(ProviderName, userProfile.Id, ProviderName));
                if (!loginResult.Succeeded)
                {
                    await _userManager.DeleteAsync(user);
                    return new AuthResult
                    {
                        Success = false,
                        Errors = loginResult.Errors.Select(e => e.Description).ToArray()
                    };
                }

                return await GenerateAuthResultForUser(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during Facebook authentication.");
                return new AuthResult { Success = false, Errors = new[] { "Error validating Facebook token." } };
            }
        }

        private static string GenerateAppSecretProof(string accessToken, string appSecret)
        {
            var hash = HMACSHA256.HashData(
                Encoding.UTF8.GetBytes(appSecret),
                Encoding.UTF8.GetBytes(accessToken));

            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        private async Task<AuthResult> GenerateAuthResultForUser(User user)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var jwtToken = _jwtTokenService.GenerateJwtToken(user, roles);
            var rawRefreshToken = await RefreshTokenHelper.RotateUserRefreshTokensAsync(_dbContext, user.Id);

            return new AuthResult
            {
                Success = true,
                Token = jwtToken,
                RefreshToken = rawRefreshToken,
                User = RefreshTokenHelper.MapToUserDto(user, roles.FirstOrDefault())
            };
        }
    }
}