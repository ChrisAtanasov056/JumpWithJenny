using ServerAPI.Models.Authentication;

namespace ServerAPI.Services.AuthService
{
    public interface IFacebookAuthService
    {
        Task<AuthResult> ExternalLoginAsync(string accessToken);
    }
}