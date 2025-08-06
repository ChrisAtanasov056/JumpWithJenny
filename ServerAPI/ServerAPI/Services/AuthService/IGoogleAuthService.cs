using System.Threading.Tasks;
using Google.Apis.Auth;
using ServerAPI.Models.Authentication;

namespace ServerAPI.Services.AuthService
{
    public interface IGoogleAuthService
    {
        Task<AuthResult> ExternalLoginAsync(string idToken);
        Task<GoogleJsonWebSignature.Payload> VerifyGoogleToken(string idToken);

        Task<TokenExchangeResult> ExchangeCodeForTokensAsync(string code);
    }
}
