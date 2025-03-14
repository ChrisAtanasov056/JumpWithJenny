namespace ServerAPI.Models.Authentication
{
    using System.ComponentModel.DataAnnotations;
    public class ForgotPasswordRequest
    {
    [Required]
    [EmailAddress]
    public string ?Email { get; set; }
    }
}