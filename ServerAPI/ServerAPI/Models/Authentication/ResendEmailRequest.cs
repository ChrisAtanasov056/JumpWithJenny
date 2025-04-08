namespace ServerAPI.Models.Authentication
{
    using System.ComponentModel.DataAnnotations;
    public class ResendEmailRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
    }
}