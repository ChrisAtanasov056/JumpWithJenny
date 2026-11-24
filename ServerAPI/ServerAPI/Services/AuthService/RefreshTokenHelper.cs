namespace ServerAPI.Services.AuthService
{
    using System;
    using System.Linq;
    using System.Security.Cryptography;
    using System.Text;
    using System.Threading.Tasks;
    using Microsoft.EntityFrameworkCore;
    using ServerAPI.Data;
    using ServerAPI.Models;
    using ServerAPI.Models.Authentication;

    internal static class RefreshTokenHelper
    {
        public static string HashToken(string rawToken)
        {
            var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
            return Convert.ToHexString(hashBytes).ToLowerInvariant();
        }

        public static (RefreshToken Entity, string RawToken) CreateRefreshToken(string userId)
        {
            var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
            var entity = new RefreshToken
            {
                Token = HashToken(rawToken),
                UserId = userId,
                Created = DateTime.UtcNow,
                Expires = DateTime.UtcNow.AddDays(7),
                Revoked = null,
                Locked = false,
            };

            return (entity, rawToken);
        }

        public static async Task<int> RevokeActiveRefreshTokensAsync(JumpWithJennyDbContext dbContext, string userId)
        {
            var activeTokens = await dbContext.RefreshTokens
                .Where(rt => rt.UserId == userId && rt.Revoked == null)
                .ToListAsync();

            if (activeTokens.Count == 0)
            {
                return 0;
            }

            var now = DateTime.UtcNow;
            foreach (var token in activeTokens)
            {
                token.Revoked = now;
                token.Locked = false;
            }

            return activeTokens.Count;
        }

        public static async Task<string> RotateUserRefreshTokensAsync(JumpWithJennyDbContext dbContext, string userId)
        {
            await RevokeActiveRefreshTokensAsync(dbContext, userId);

            var (entity, rawToken) = CreateRefreshToken(userId);
            dbContext.RefreshTokens.Add(entity);
            await dbContext.SaveChangesAsync();

            return rawToken;
        }

        public static UserDto MapToUserDto(User user, string role)
        {
            return new UserDto
            {
                id = user.Id,
                email = user.Email,
                username = user.UserName,
                firstname = user.FirstName,
                lastname = user.LastName,
                emailConfirmed = user.EmailConfirmed,
                role = role,
            };
        }
    }
}
