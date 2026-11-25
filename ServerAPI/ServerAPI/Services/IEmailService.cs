using ServerAPI.Models.Enums;

namespace ServerAPI.Services
{
    public class BookingConfirmationEmailModel
    {
        public string ToEmail { get; set; }

        public string FullName { get; set; }

        public string WorkoutDay { get; set; }

        public string WorkoutTime { get; set; }

        public DateTime WorkoutDateSofia { get; set; }

        public ShoesSize? ShoeSize { get; set; }

        public bool UsesOwnShoes { get; set; }

        public CardType CardType { get; set; }

        public string CancellationToken { get; set; }

        public string Language { get; set; } = "bg";
    }

    public interface IEmailService
    {
        Task SendPasswordResetEmailAsync(string email, string token, string language);

        Task SendConfirmationEmailAsync(string email, string token, string language);

        Task<bool> SendBookingConfirmationEmailAsync(BookingConfirmationEmailModel model);

        Task<bool> SendEmailAsync(string toEmail, string subject, string body, string replyToEmail = null);
    }
}
