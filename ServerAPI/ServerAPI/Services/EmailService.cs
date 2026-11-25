using System.Net;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ServerAPI.Models.Enums;

namespace ServerAPI.Services
{
    public class EmailService : IEmailService
    {
        private static readonly Dictionary<string, string> BulgarianDays = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Monday"] = "Понеделник",
            ["Tuesday"] = "Вторник",
            ["Wednesday"] = "Сряда",
            ["Thursday"] = "Четвъртък",
            ["Friday"] = "Петък",
            ["Saturday"] = "Събота",
            ["Sunday"] = "Неделя",
        };

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

        public async Task<bool> SendBookingConfirmationEmailAsync(BookingConfirmationEmailModel model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.ToEmail) || string.IsNullOrWhiteSpace(model.CancellationToken))
            {
                return false;
            }

            var lang = string.Equals(model.Language, "en", StringComparison.OrdinalIgnoreCase) ? "en" : "bg";
            var frontendUrl = (_configuration["FrontendBaseUrl"] ?? _configuration["WebsiteUrl"] ?? "https://jumpwithjenny.com").TrimEnd('/');
            var websiteUrl = (_configuration["WebsiteUrl"] ?? frontendUrl).TrimEnd('/');
            var contactUrl = $"{websiteUrl}/#contacts";
            var cancelUrl = $"{frontendUrl}/cancel-booking/{Uri.EscapeDataString(model.CancellationToken)}";

            var textsPath = ResolveResourcePath($"emailTexts.{lang}.json");
            var layoutPath = ResolveResourcePath("EmailTemplate.html");

            var textsRoot = JObject.Parse(await File.ReadAllTextAsync(textsPath));
            var texts = textsRoot["BookingConfirmation"]
                ?? throw new InvalidOperationException("Missing BookingConfirmation section in emailTexts resource.");
            var emailLayout = await File.ReadAllTextAsync(layoutPath);

            string Text(string key) => (string)texts[key] ?? string.Empty;

            var safeName = WebUtility.HtmlEncode(model.FullName ?? string.Empty);
            var dayLabel = lang == "bg" && !string.IsNullOrWhiteSpace(model.WorkoutDay) && BulgarianDays.TryGetValue(model.WorkoutDay, out var bgDay)
                ? bgDay
                : model.WorkoutDay ?? string.Empty;
            var formattedDate = model.WorkoutDateSofia != default
                ? model.WorkoutDateSofia.ToString("dd.MM.yyyy")
                : "-";
            var shoesText = model.UsesOwnShoes
                ? Text("OwnShoesValue")
                : $"{Text("ShoeSizePrefix")} {FormatShoeSize(model.ShoeSize)}";
            var cardText = model.CardType switch
            {
                CardType.CoolFit => Text("CardCoolFit"),
                CardType.PulseCard => Text("CardPulse"),
                _ => Text("CardIndividual"),
            };

            var detailsBlock = $@"
                <table cellpadding='8' cellspacing='0' border='0' width='100%' style='background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 18px 0;'>
                    <tr>
                        <td style='font-weight: bold; color: #2c3e50; width: 35%;'>{WebUtility.HtmlEncode(Text("DayLabel"))}:</td>
                        <td style='color: #333333;'>{WebUtility.HtmlEncode(dayLabel)}</td>
                    </tr>
                    <tr>
                        <td style='font-weight: bold; color: #2c3e50;'>{WebUtility.HtmlEncode(Text("DateLabel"))}:</td>
                        <td style='color: #333333;'>{WebUtility.HtmlEncode(formattedDate)}</td>
                    </tr>
                    <tr>
                        <td style='font-weight: bold; color: #2c3e50;'>{WebUtility.HtmlEncode(Text("TimeLabel"))}:</td>
                        <td style='color: #333333;'>{WebUtility.HtmlEncode(model.WorkoutTime ?? string.Empty)}</td>
                    </tr>
                    <tr>
                        <td style='font-weight: bold; color: #2c3e50;'>{WebUtility.HtmlEncode(Text("ShoesLabel"))}:</td>
                        <td style='color: #333333;'>{WebUtility.HtmlEncode(shoesText)}</td>
                    </tr>
                    <tr>
                        <td style='font-weight: bold; color: #2c3e50;'>{WebUtility.HtmlEncode(Text("VisitTypeLabel"))}:</td>
                        <td style='color: #333333;'>{WebUtility.HtmlEncode(cardText)}</td>
                    </tr>
                    <tr>
                        <td style='font-weight: bold; color: #2c3e50;'>{WebUtility.HtmlEncode(Text("LocationLabel"))}:</td>
                        <td style='color: #333333;'>{WebUtility.HtmlEncode(Text("LocationValue"))}</td>
                    </tr>
                </table>";

            var cancelButton = $@"
                <table cellpadding='0' cellspacing='0' border='0' align='center'>
                    <tr><td align='center'>
                        <a href='{WebUtility.HtmlEncode(cancelUrl)}' class='button'>{WebUtility.HtmlEncode(Text("CancelButtonText"))}</a>
                    </td></tr>
                </table>";

            var bodyContent = $@"
                <h1>{WebUtility.HtmlEncode(Text("Heading"))}</h1>
                <p>{WebUtility.HtmlEncode(Text("Greeting"))}, {safeName}!</p>
                <p>{WebUtility.HtmlEncode(Text("Intro"))}</p>
                {detailsBlock}
                <p>{WebUtility.HtmlEncode(Text("CancelInstructions"))}</p>
                {cancelButton}
                <p>{Text("Signature")}</p>";

            var subject = Text("Subject");
            var finalEmailHtml = emailLayout
                .Replace("{{lang}}", lang)
                .Replace("{{subject}}", WebUtility.HtmlEncode(subject))
                .Replace("{{bodyContent}}", bodyContent)
                .Replace("{{websiteUrl}}", WebUtility.HtmlEncode(websiteUrl))
                .Replace("{{contactUrl}}", WebUtility.HtmlEncode(contactUrl))
                .Replace("{{currentYear}}", DateTime.UtcNow.Year.ToString())
                .Replace("{{allRightsReserved}}", WebUtility.HtmlEncode(Text("AllRightsReserved")))
                .Replace("{{contactUs}}", WebUtility.HtmlEncode(Text("ContactUs")));

            return await SendEmailAsync(model.ToEmail, subject, finalEmailHtml);
        }

        private static string FormatShoeSize(ShoesSize? size) => size switch
        {
            ShoesSize.s => "S (36-38)",
            ShoesSize.m => "M (39-41)",
            ShoesSize.l => "L (42-44)",
            ShoesSize.xl => "XL (44-46)",
            _ => "-",
        };

        private static string ResolveResourcePath(string fileName)
        {
            var baseDirPath = Path.Combine(AppContext.BaseDirectory, "Resources", fileName);
            if (File.Exists(baseDirPath))
            {
                return baseDirPath;
            }

            var currentDirPath = Path.Combine(Directory.GetCurrentDirectory(), "Resources", fileName);
            if (File.Exists(currentDirPath))
            {
                return currentDirPath;
            }

            throw new FileNotFoundException($"Email resource file '{fileName}' was not found.");
        }

        public async Task<bool> SendEmailAsync(string toEmail, string subject, string body, string replyToEmail = null)
        {
            var smtpHost = _configuration["EmailSettings:SmtpHost"];
            var smtpUser = _configuration["EmailSettings:Username"];
            var smtpPass = _configuration["EmailSettings:Password"];
            var fromEmail = _configuration["EmailSettings:FromEmail"];
            var fromName = _configuration["EmailSettings:FromName"];

            if (string.IsNullOrWhiteSpace(fromEmail) || !MailboxAddress.TryParse(fromEmail, out var parsedFrom))
            {
                _logger.LogError("Invalid or missing EmailSettings:FromEmail configuration.");
                return false;
            }

            if (string.IsNullOrWhiteSpace(toEmail) || !MailboxAddress.TryParse(toEmail, out var parsedTo))
            {
                _logger.LogError("Invalid recipient email address.");
                return false;
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName ?? string.Empty, parsedFrom.Address));
            message.To.Add(parsedTo);
            message.Subject = (subject ?? string.Empty).Replace("\r", string.Empty).Replace("\n", string.Empty);

            if (!string.IsNullOrWhiteSpace(replyToEmail))
            {
                if (!MailboxAddress.TryParse(replyToEmail, out var parsedReplyTo))
                {
                    _logger.LogWarning("Invalid reply-to email address provided.");
                    return false;
                }
                message.ReplyTo.Add(parsedReplyTo);
            }

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
                    _logger.LogError(tlsEx, "Failed to authenticate on both SSL (Port 465) and STARTTLS (Port 587).");
                    return false;
                }
            }

            try
            {
                await client.SendAsync(message);
                _logger.LogInformation("Email sent to {Recipient} with subject '{Subject}'.", toEmail, subject);
            }
            catch (Exception sendEx)
            {
                _logger.LogError(sendEx, "Failed to send email to {Recipient}.", toEmail);
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
