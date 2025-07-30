namespace ServerAPI.Services
{
    public interface IEmailService
    {
         Task SendPasswordResetEmailAsync(string email, string token, string language);
        Task SendConfirmationEmailAsync(string email, string token, string language);
        Task<bool> SendEmailAsync(string toEmail, string subject, string body , string replyToEmail = null);
    }
}