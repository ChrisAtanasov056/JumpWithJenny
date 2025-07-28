public class ForgotPasswordResetRequest
{
    public string Email { get; set; } = null!;          // User Id
    public string Token { get; set; } = null!;       // Reset token от имейла
    public string NewPassword { get; set; } = null!; // Новата парола
}