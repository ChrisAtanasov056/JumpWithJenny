using MailKit.Net.Smtp;
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
            try
            {
                var smtpHost = _configuration["EmailSettings:SmtpHost"];
                var smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"]);
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
                // Свързваме се с SMTP с implicit SSL (port 465)
                await client.ConnectAsync(smtpHost, smtpPort, true);

                // Аутентификация
                await client.AuthenticateAsync(smtpUser, smtpPass);

                // Изпращаме
                await client.SendAsync(message);

                await client.DisconnectAsync(true);

                _logger.LogInformation($"Email sent to {toEmail} with subject '{subject}'.");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending email to {toEmail}");
                return false;
            }
        }
    }
}
