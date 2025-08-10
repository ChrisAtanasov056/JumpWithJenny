// Services/AuthService/FacebookAuthService.cs
using ServerAPI.Models.Authentication;
using System.Net.Http;
using System.Threading.Tasks;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using ServerAPI.Data;
using ServerAPI.Models;
using ServerAPI.Common;
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Text;

namespace ServerAPI.Services.AuthService
{
    public class FacebookAuthService : IFacebookAuthService
    {
        private readonly HttpClient _httpClient;
        private readonly UserManager<User> _userManager;
        private readonly JumpWithJennyDbContext _dbContext;
        private readonly IConfiguration _configuration;
        private readonly JwtTokenService _jwtTokenService;

        public FacebookAuthService(
            HttpClient httpClient,
            UserManager<User> userManager,
            JumpWithJennyDbContext dbContext,
            IConfiguration configuration,
            JwtTokenService jwtTokenService)
        {
            _httpClient = httpClient;
            _userManager = userManager;
            _dbContext = dbContext;
            _configuration = configuration;
            _jwtTokenService = jwtTokenService;
        }

        public async Task<AuthResult> ExternalLoginAsync(string accessToken)
        {
            try
            {
                // 1. Вземете AppSecret от конфигурацията
                var appSecret = _configuration["Authentication:Facebook:AppSecret"];
                if (string.IsNullOrEmpty(appSecret))
                {
                     return new AuthResult { Success = false, Errors = new[] { "Facebook App Secret is not configured in appsettings." } };
                }

                // 2. Генерирайте appsecret_proof
                var appSecretProof = GenerateAppSecretProof(accessToken, appSecret);

                // 3. Използвайте appsecret_proof в URL заявката към Facebook
                string facebookApiUrl = $"https://graph.facebook.com/v18.0/me?fields=id,name,email,first_name,last_name&access_token={accessToken}&appsecret_proof={appSecretProof}";

                var response = await _httpClient.GetAsync(facebookApiUrl);
                response.EnsureSuccessStatusCode();

                var userProfile = await JsonSerializer.DeserializeAsync<FacebookUserProfile>(await response.Content.ReadAsStreamAsync());

                if (userProfile == null || string.IsNullOrEmpty(userProfile.Email))
                {
                    return new AuthResult { Success = false, Errors = new[] { "Failed to get user data from Facebook." } };
                }

                // 4. Намиране или създаване на потребителя в нашата база данни
                var user = await _userManager.FindByEmailAsync(userProfile.Email);
                if (user == null)
                {
                    user = new User
                    {
                        UserName = userProfile.Email,
                        Email = userProfile.Email,
                        FirstName = userProfile.FirstName,
                        LastName = userProfile.LastName,
                        EmailConfirmed = true,
                        IsExternalLogin = true
                    };

                    var createResult = await _userManager.CreateAsync(user);
                    if (!createResult.Succeeded)
                    {
                        return new AuthResult { Success = false, Errors = createResult.Errors.Select(e => e.Description).ToArray() };
                    }
                    await _userManager.AddToRoleAsync(user, GlobalConstants.UserRoleName);
                }
            
                // 5. Генериране на токени
                return await GenerateAuthResultForUser(user);
            }
            catch (Exception ex)
            {
                return new AuthResult { Success = false, Errors = new[] { $"Error validating Facebook token: {ex.Message}" } };
            }
        }
        
        // Метод за генериране на appsecret_proof
        private string GenerateAppSecretProof(string accessToken, string appSecret)
        {
            var hmacSha256 = new HMACSHA256(Encoding.UTF8.GetBytes(appSecret));
            var hash = hmacSha256.ComputeHash(Encoding.UTF8.GetBytes(accessToken));
        
            return BitConverter.ToString(hash).Replace("-", "").ToLower();
        }

        private async Task<AuthResult> GenerateAuthResultForUser(User user)
        {
            // Този метод е същият като този в GoogleAuthService
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
}