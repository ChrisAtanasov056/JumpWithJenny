using System.Collections.Generic;
using System.IO;
using Newtonsoft.Json;
using ServerAPI.Models;

namespace ServerAPI.Services;

public interface IEmailTemplateService
{
    EmailText GetTemplate(string type, string language);
}

public class EmailTemplateService : IEmailTemplateService
{
    private readonly Dictionary<string, EmailTextsByType> _emailTexts = new();

    public EmailTemplateService()
    {
        LoadEmailTemplates();
    }

    private void LoadEmailTemplates()
    {
        var languages = new[] { "en", "bg" };

        foreach (var lang in languages)
        {
            var path = Path.Combine("Resources", $"emailTexts.{lang}.json");
            if (File.Exists(path))
            {
                var json = File.ReadAllText(path);
                var templates = JsonConvert.DeserializeObject<EmailTextsByType>(json);
                _emailTexts[lang] = templates;
            }
        }
    }

    public EmailText GetTemplate(string type, string language)
    {
        if (!_emailTexts.TryGetValue(language, out var templates))
            templates = _emailTexts["en"]; // fallback

        return type switch
        {
            "ResetPassword" => templates.ResetPassword,
            "ConfirmAccount" => templates.ConfirmAccount,
            _ => throw new KeyNotFoundException($"No template found for type '{type}'")
        };
    }
}
