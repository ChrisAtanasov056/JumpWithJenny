using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;

namespace ServerAPI.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly HttpClient _httpClient;
    private readonly IEmailTemplateService _templateService;

    public EmailService(IConfiguration config, IEmailTemplateService templateService)
    {
        _config = config;
        _templateService = templateService;
        _httpClient = new HttpClient();
    }

    public async Task SendPasswordResetEmailAsync(string email, string token, string language)
    {
        var template = _templateService.GetTemplate("ResetPassword", language);
        var link = $"{_config["FrontendBaseUrl"]}/reset-password?token={WebUtility.UrlEncode(token)}&email={WebUtility.UrlEncode(email)}";

        var subject = template.Subject;
        var body = string.Format(template.Body, link);

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendConfirmationEmailAsync(string email, string token, string language)
    {
        var template = _templateService.GetTemplate("ConfirmAccount", language);
        var link = $"{_config["FrontendBaseUrl"]}/confirm-account?token={WebUtility.UrlEncode(token)}&email={WebUtility.UrlEncode(email)}";

        var subject = template.Subject;
        var body = string.Format(template.Body, link);

        await SendEmailAsync(email, subject, body);
    }

    public async Task<bool> SendEmailAsync(string toEmail, string subject, string body)
    {
        var request = new
        {
            sender = new
            {
                name = _config["EmailSettings:FromName"],
                email = _config["EmailSettings:FromEmail"]
            },
            to = new[] { new { email = toEmail } },
            subject = subject,
            htmlContent = body
        };

        var json = JsonConvert.SerializeObject(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Add("api-key", _config["EmailSettings:BrevoApiKey"]);

        var response = await _httpClient.PostAsync("https://api.brevo.com/v3/smtp/email", content);
        if (response.IsSuccessStatusCode)
            return true;

        var error = await response.Content.ReadAsStringAsync();
        Console.WriteLine($"Email failed: {error}");
        return false;
    }
}
