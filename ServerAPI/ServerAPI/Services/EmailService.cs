using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace ServerAPI.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;
        private readonly IEmailTemplateService _emailTemplateService;

        public EmailService(
            IConfiguration configuration,
            ILogger<EmailService> logger,
            IEmailTemplateService emailTemplateService)
        {
            _configuration = configuration;
            _logger = logger;
            _emailTemplateService = emailTemplateService;
        }

        public async Task SendPasswordResetEmailAsync(string email, string token, string language)
        {
            var frontendUrl = _configuration["FrontendBaseUrl"];
            var resetLink = $"{frontendUrl}/{language}/reset-password?token={System.Web.HttpUtility.UrlEncode(token)}&email={email}";

            var template = _emailTemplateService.GetTemplate("ResetPassword", language);
            var subject = template.Subject;
            var body = template.Body.Replace("{resetLink}", resetLink);

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendConfirmationEmailAsync(string email, string token, string language)
        {
            var frontendUrl = _configuration["FrontendBaseUrl"];
            var confirmationLink = $"{frontendUrl}/{language}/verify-email?token={System.Web.HttpUtility.UrlEncode(token)}&email={email}";

            var template = _emailTemplateService.GetTemplate("ConfirmAccount", language);
            var subject = template.Subject;
            var body = template.Body.Replace("{confirmationLink}", confirmationLink);

            await SendEmailAsync(email, subject, body);
        }

        public async Task<bool> SendEmailAsync(string toEmail, string subject, string body)
        {
            var smtpHost = _configuration["EmailSettings:SmtpHost"];
            var smtpUser = _configuration["EmailSettings:Username"];
            var smtpPass = _configuration["EmailSettings:Password"];
            var fromEmail = _configuration["EmailSettings:FromEmail"];
            var fromName = _configuration["EmailSettings:FromName"];

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromEmail));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = body
            };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();

            try
            {
                _logger.LogInformation("Attempting to connect with SSL (Port 465)...");
                await client.ConnectAsync(smtpHost, 465, SecureSocketOptions.SslOnConnect);
                await client.AuthenticateAsync(smtpUser, smtpPass);
                _logger.LogInformation("Authenticated successfully using SSL (Port 465).");
            }
            catch (Exception sslEx)
            {
                _logger.LogWarning(sslEx, "SSL connection failed. Trying STARTTLS (Port 587)...");

                try
                {
                    await client.DisconnectAsync(true);

                    await client.ConnectAsync(smtpHost, 587, SecureSocketOptions.StartTls);
                    await client.AuthenticateAsync(smtpUser, smtpPass);
                    _logger.LogInformation("Authenticated successfully using STARTTLS (Port 587).");
                }
                catch (Exception tlsEx)
                {
                    _logger.LogError(tlsEx, $"Failed to authenticate on both SSL (Port 465) and STARTTLS (Port 587).");
                    return false;
                }
            }

            try
            {
                await client.SendAsync(message);
                _logger.LogInformation($"Email sent to {toEmail} with subject '{subject}'.");
            }
            catch (Exception sendEx)
            {
                _logger.LogError(sendEx, $"Failed to send email to {toEmail}.");
                return false;
            }
            finally
            {
                await client.DisconnectAsync(true);
            }

            return true;
        }
    }
}
