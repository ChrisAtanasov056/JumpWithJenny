namespace ServerAPI.Models.Authentication
{
    using System.ComponentModel.DataAnnotations;
    public class ResetPasswordRequest
    {
        public string UserId { get; set; }
        public string CurrentPassword { get; set; }
        public string NewPassword { get; set; }
    }
}