using System.Net;
using MimeKit;
using ServerAPI.Models.Contacts;

namespace ServerAPI.Services.Contacts
{
    public class ContactService : IContactService
{
    private readonly IEmailService _emailService;
    private readonly ILogger<ContactService> _logger;
    private readonly IConfiguration _configuration;

    public ContactService(IEmailService emailService, ILogger<ContactService> logger, IConfiguration configuration)
    {
        _emailService = emailService;
        _logger = logger;
        _configuration = configuration;
    }

    public async Task<(bool Success, List<string> Errors)> ProcessContactFormAsync(ContactFormDto contactForm)
    {
        var errors = new List<string>();

        if (contactForm == null)
        {
            errors.Add("Invalid contact form payload.");
            return (false, errors);
        }

        if (string.IsNullOrWhiteSpace(contactForm.Name))
            errors.Add("Name is required.");
        if (string.IsNullOrWhiteSpace(contactForm.Email))
            errors.Add("Email is required.");
        if (string.IsNullOrWhiteSpace(contactForm.Subject))
            errors.Add("Subject is required.");
        if (string.IsNullOrWhiteSpace(contactForm.Message))
            errors.Add("Message is required.");

        if (!string.IsNullOrWhiteSpace(contactForm.Email) && !MailboxAddress.TryParse(contactForm.Email.Trim(), out _))
            errors.Add("Invalid email address.");

        if (errors.Any())
            return (false, errors);

        var cleanSubject = contactForm.Subject.Replace("\r", string.Empty).Replace("\n", string.Empty).Trim();
        var encodedName = WebUtility.HtmlEncode(contactForm.Name.Trim());
        var encodedEmail = WebUtility.HtmlEncode(contactForm.Email.Trim());
        var encodedSubject = WebUtility.HtmlEncode(cleanSubject);
        var encodedMessage = WebUtility.HtmlEncode(contactForm.Message.Trim())
            .Replace("\r\n", "<br />")
            .Replace("\n", "<br />");

        var emailBody = $@"
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset=""UTF-8"" />
        <style>
            body {{
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            color: #333;
            margin: 0;
            padding: 20px;
            }}
            .container {{
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            max-width: 600px;
            margin: auto;
            }}
            h2 {{
            color: #E74C3C;
            }}
            p {{
            line-height: 1.5;
            }}
            .footer {{
            font-size: 12px;
            color: #999;
            margin-top: 30px;
            text-align: center;
            }}
            a {{
            color: #E74C3C;
            text-decoration: none;
            }}
            a:hover {{
            text-decoration: underline;
            }}
        </style>
        </head>
        <body>
        <div class=""container"">
            <h2>Нов контакт от формата</h2>
            <p><strong>Име:</strong> {encodedName}</p>
            <p><strong>Email:</strong> {encodedEmail}</p>
            <p><strong>Тема:</strong> {encodedSubject}</p>
            <p><strong>Съобщение:</strong><br />{encodedMessage}</p>
            <div class=""footer"">
            Това е автоматично генериран имейл. Моля, не отговаряйте на него.
            </div>
        </div>
        </body>
        </html>";


        var toEmail = _configuration["ContactSettings:RecipientEmail"]
            ?? _configuration["EmailSettings:FromEmail"]
            ?? "jumpwithjenny.kj@gmail.com";
        var subject = $"Contact Form: {cleanSubject}";

        var sent = await _emailService.SendEmailAsync(toEmail, subject, emailBody, contactForm.Email.Trim());

        if (!sent)
        {
            _logger.LogError("Failed to send contact form email.");
            errors.Add("Failed to send email. Please try again later.");
            return (false, errors);
        }

        _logger.LogInformation("Contact form email sent to {ToEmail} with subject: {Subject}", toEmail, subject);
        return (true, null);
    }
}

}