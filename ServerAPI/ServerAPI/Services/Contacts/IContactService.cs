using ServerAPI.Models.Contacts;

namespace ServerAPI.Services.Contacts
{
    public interface IContactService
{
    Task<(bool Success, List<string> Errors)> ProcessContactFormAsync(ContactFormDto contactForm);
}

}