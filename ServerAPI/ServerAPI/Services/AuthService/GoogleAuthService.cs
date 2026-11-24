using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ServerAPI.Common;
using ServerAPI.Data;
using ServerAPI.Models;
using ServerAPI.Models.Authentication;

namespace ServerAPI.Services.AuthService
{
    public class GoogleAuthService : IGoogleAuthService
    {
        private const string ProviderName = "Google";

        private readonly UserManager<User> _userManager;
        private readonly IConfiguration _configuration;
        private readonly JumpWithJennyDbContext _dbContext;
        private readonly JwtTokenService _jwtTokenService;
        private readonly HttpClient _httpClient;
        private readonly ILogger<GoogleAuthService> _logger;

        public GoogleAuthService(
            JwtTokenService jwtTokenService,
            UserManager<User> userManager,
            JumpWithJennyDbContext dbContext,
            IConfiguration configuration,
            HttpClient httpClient,
            ILogger<GoogleAuthService> logger)
        {
            _jwtTokenService = jwtTokenService;
            _userManager = userManager;
            _dbContext = dbContext;
            _configuration = configuration;
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<AuthResult> ExternalLoginAsync(string idToken)
        {
            var payload = await VerifyGoogleToken(idToken);
            if (payload == null ||
                string.IsNullOrWhiteSpace(payload.Subject) ||
                string.IsNullOrWhiteSpace(payload.Email) ||
                !payload.EmailVerified)
            {
                return new AuthResult
                {
                    Success = false,
                    Errors = new[] { "Google account email is not verified or invalid." }
                };
            }

            var user = await _userManager.FindByLoginAsync(ProviderName, payload.Subject);
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

            user = await _userManager.FindByEmailAsync(payload.Email);
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
                if (existingLogins.Any(l => l.LoginProvider == ProviderName && l.ProviderKey != payload.Subject))
                {
                    return new AuthResult
                    {
                        Success = false,
                        Errors = new[] { "A different Google account is already linked to this user." }
                    };
                }

                if (!existingLogins.Any(l => l.LoginProvider == ProviderName && l.ProviderKey == payload.Subject))
                {
                    var addLoginResult = await _userManager.AddLoginAsync(
                        user,
                        new UserLoginInfo(ProviderName, payload.Subject, ProviderName));
                    if (!addLoginResult.Succeeded)
                    {
                        return new AuthResult
                        {
                            Success = false,
                            Errors = addLoginResult.Errors.Select(e => e.Description)
                        };
                    }
                }

                return await GenerateAuthResultForUser(user);
            }

            user = new User
            {
                UserName = payload.Email,
                Email = payload.Email,
                FirstName = payload.GivenName ?? string.Empty,
                LastName = payload.FamilyName ?? string.Empty,
                EmailConfirmed = true,
                IsExternalLogin = true,
                ProviderName = ProviderName,
                ProviderId = payload.Subject
            };

            var createResult = await _userManager.CreateAsync(user);
            if (!createResult.Succeeded)
            {
                return new AuthResult
                {
                    Success = false,
                    Errors = createResult.Errors.Select(e => e.Description)
                };
            }

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

            var loginResult = await _userManager.AddLoginAsync(
                user,
                new UserLoginInfo(ProviderName, payload.Subject, ProviderName));
            if (!loginResult.Succeeded)
            {
                await _userManager.DeleteAsync(user);
                return new AuthResult
                {
                    Success = false,
                    Errors = loginResult.Errors.Select(e => e.Description)
                };
            }

            return await GenerateAuthResultForUser(user);
        }

        public async Task<GoogleJsonWebSignature.Payload> VerifyGoogleToken(string idToken)
        {
            if (string.IsNullOrWhiteSpace(idToken))
            {
                return null;
            }

            var clientId = _configuration["Authentication:Google:ClientId"];
            if (string.IsNullOrWhiteSpace(clientId))
            {
                _logger.LogError("Google ClientId is not configured.");
                return null;
            }

            var settings = new GoogleJsonWebSignature.ValidationSettings()
            {
                Audience = new List<string> { clientId }
            };

            try
            {
                var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
                return payload;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Google token validation failed.");
                return null;
            }
        }

        public async Task<TokenExchangeResult> ExchangeCodeForTokensAsync(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return new TokenExchangeResult
                {
                    Success = false,
                    Errors = new[] { "Authorization code is required." }
                };
            }

            var clientId = _configuration["Authentication:Google:ClientId"];
            var clientSecret = _configuration["Authentication:Google:ClientSecret"];
            var redirectUri = _configuration["Authentication:Google:RedirectUri"];

            if (string.IsNullOrWhiteSpace(clientId) ||
                string.IsNullOrWhiteSpace(clientSecret) ||
                string.IsNullOrWhiteSpace(redirectUri))
            {
                _logger.LogError("Google OAuth configuration values are missing.");
                return new TokenExchangeResult
                {
                    Success = false,
                    Errors = new[] { "Google authentication is not properly configured." }
                };
            }

            var tokenRequestUri = "https://oauth2.googleapis.com/token";

            var formContent = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                { "code", code },
                { "client_id", clientId },
                { "client_secret", clientSecret },
                { "redirect_uri", redirectUri },
                { "grant_type", "authorization_code" }
            });

            try
            {
                var response = await _httpClient.PostAsync(tokenRequestUri, formContent);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Google token exchange returned HTTP {StatusCode}", (int)response.StatusCode);
                    return new TokenExchangeResult
                    {
                        Success = false,
                        Errors = new[] { "Failed to exchange Google authorization code." }
                    };
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var tokenResponse = System.Text.Json.JsonSerializer.Deserialize<GoogleTokenResponse>(responseContent);

                if (tokenResponse == null || string.IsNullOrEmpty(tokenResponse.IdToken))
                {
                    return new TokenExchangeResult
                    {
                        Success = false,
                        Errors = new[] { "Failed to get tokens from Google." }
                    };
                }

                return new TokenExchangeResult
                {
                    Success = true,
                    IdToken = tokenResponse.IdToken,
                    AccessToken = tokenResponse.AccessToken
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exchanging Google authorization code for tokens.");
                return new TokenExchangeResult
                {
                    Success = false,
                    Errors = new[] { "Error exchanging Google authorization code." }
                };
            }
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

    // Response model for Google OAuth token endpoint
    public class GoogleTokenResponse
    {
        [System.Text.Json.Serialization.JsonPropertyName("id_token")]
        public string IdToken { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("access_token")]
        public string AccessToken { get; set; }
    }
}