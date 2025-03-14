using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using ServerAPI.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendPasswordResetEmailAsync(string email, string token)
    {

        var frontendUrl = _configuration["FrontendBaseUrl"];
        var encodedToken = WebUtility.UrlEncode(token);
        var resetLink = $"{frontendUrl}/reset-password?token={encodedToken}&email={email}";
        
        var subject = "Password Reset Request";
        var body = $"""
            <h1>Password Reset</h1>
            <p>Click the link below to reset your password:</p>
            <a href="{resetLink}">Reset Password</a>
            <p>This link will expire in 24 hours.</p>
        """;
        
        await SendEmailAsync(email, subject, body);
    }
    public async Task<bool> SendEmailAsync(string toEmail, string subject, string body)
    {
        try
        {
            var smtpClient = new SmtpClient(_configuration["EmailSettings:SmtpServer"])
            {
                Port = int.Parse(_configuration["EmailSettings:SmtpPort"]),
                Credentials = new NetworkCredential(
                    _configuration["EmailSettings:SmtpUsername"],
                    _configuration["EmailSettings:SmtpPassword"]
                ),
                EnableSsl = true,
            };

            var fromEmail = _configuration["EmailSettings:FromEmail"];
            var fromName = _configuration["EmailSettings:FromName"];
            var fromAddress = new MailAddress(fromEmail, fromName);
            var toAddress = new MailAddress(toEmail);

            var message = new MailMessage(fromAddress, toAddress)
            {
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };

            // Send email asynchronously
            await smtpClient.SendMailAsync(message);

            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error sending email: {ex.Message}");
            return false;
        }
    }
}