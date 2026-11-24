using System.ComponentModel.DataAnnotations;

namespace ServerAPI.Models.Contacts
{
    public class ContactFormDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; }

        [Required]
        [EmailAddress]
        [MaxLength(254)]
        public string Email { get; set; }

        [Required]
        [MaxLength(200)]
        public string Subject { get; set; }

        [Required]
        [MaxLength(4000)]
        public string Message { get; set; }

    }
}