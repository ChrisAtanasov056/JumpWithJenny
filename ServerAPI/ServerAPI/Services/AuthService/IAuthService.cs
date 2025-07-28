// IAuthService.cs
using ServerAPI.Models.Authentication;

public interface IAuthService
{
    Task<AuthResult> SignUpAsync(SignUpModel model);
    Task<AuthResult> LoginAsync(LoginModel model);
    Task<AuthResult> ConfirmEmailAsync(ConfirmEmailRequest request);
    Task<AuthResult> VerifyEmailStatusAsync(string userId);
    Task<AuthResult> ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<AuthResult> ChangePasswordAsync(ResetPasswordRequest request);
    Task<AuthResult> ResendVerificationEmailAsync(ResendEmailRequest request);
    Task<AuthResult> RefreshTokenAsync(string token);

    Task<AuthResult> ResetPasswordAsync(ForgotPasswordResetRequest request);
}


