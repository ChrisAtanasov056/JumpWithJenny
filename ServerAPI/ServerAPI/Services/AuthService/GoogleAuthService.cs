using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using ServerAPI.Common;
using ServerAPI.Data;
using ServerAPI.Models;
using ServerAPI.Models.Authentication;
using ServerAPI.Services.Users;

namespace ServerAPI.Services.AuthService
{
    public class GoogleAuthService : IGoogleAuthService
    {
        private readonly UserManager<User> _userManager;
        private readonly IUserService _userService;
        private readonly IConfiguration _configuration;
        private readonly JumpWithJennyDbContext _dbContext;
        private readonly JwtTokenService _jwtTokenService;
        private readonly HttpClient _httpClient;

        public GoogleAuthService(
            JwtTokenService jwtTokenService,
            UserManager<User> userManager,
            IUserService userService,
            JumpWithJennyDbContext dbContext,
            IConfiguration configuration,
            HttpClient httpClient)
        {
            _jwtTokenService = jwtTokenService;
            _userManager = userManager;
            _userService = userService;
            _dbContext = dbContext;
            _configuration = configuration;
            _httpClient = httpClient;
        }

        public async Task<AuthResult> ExternalLoginAsync(string idToken)
        {
            var payload = await VerifyGoogleToken(idToken);
            if (payload == null)
            {
                return new AuthResult
                {
                    Success = false,
                    Errors = new[] { "Invalid Google token." }
                };
            }

            var user = await _userManager.FindByEmailAsync(payload.Email);

            if (user != null)
            {
                return await GenerateAuthResultForUser(user);
            }

            user = new User
            {
                UserName = payload.Email,
                Email = payload.Email,
                FirstName = payload.GivenName,
                LastName = payload.FamilyName,
                EmailConfirmed = true,
                IsExternalLogin = true
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

            await _userManager.AddToRoleAsync(user, GlobalConstants.UserRoleName);

            return await GenerateAuthResultForUser(user);
        }

        public async Task<GoogleJsonWebSignature.Payload> VerifyGoogleToken(string idToken)
        {
            var clientId = _configuration["Authentication:Google:ClientId"];
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
                Console.WriteLine($"Google token validation failed: {ex.Message}");
                return null;
            }
        }
        
        public async Task<TokenExchangeResult> ExchangeCodeForTokensAsync(string code)
        {
            var clientId = _configuration["Authentication:Google:ClientId"];
            var clientSecret = _configuration["Authentication:Google:ClientSecret"];
            var redirectUri = _configuration["Authentication:Google:RedirectUri"];

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
                response.EnsureSuccessStatusCode();

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
                return new TokenExchangeResult
                {
                    Success = false,
                    Errors = new[] { $"Error exchanging code for tokens: {ex.Message}" }
                };
            }
        }

        private async Task<AuthResult> GenerateAuthResultForUser(User user)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var jwtToken = _jwtTokenService.GenerateJwtToken(user, roles);

            var existingRefreshToken = await _dbContext.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.UserId == user.Id);
            
            RefreshToken refreshToken;
            if (existingRefreshToken != null)
            {
                existingRefreshToken.Revoked = DateTime.UtcNow;
                _dbContext.RefreshTokens.Update(existingRefreshToken);
                refreshToken = GenerateRefreshToken();
                refreshToken.UserId = user.Id;
                _dbContext.RefreshTokens.Add(refreshToken);
            }
            else
            {
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

        private static RefreshToken GenerateRefreshToken()
        {
            return new RefreshToken
            {
                Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
                Expires = DateTime.UtcNow.AddDays(7),
                Revoked = null
            };
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
    }
    
    // Модел, който да улавя отговора от Google
    public class GoogleTokenResponse
    {
        [System.Text.Json.Serialization.JsonPropertyName("id_token")]
        public string IdToken { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("access_token")]
        public string AccessToken { get; set; }
    }
}