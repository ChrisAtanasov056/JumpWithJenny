namespace ServerAPI.Models.Authentication
{
    using System.ComponentModel.DataAnnotations;
    public class ResendEmailRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        public string Language { get; set; }
    }
}