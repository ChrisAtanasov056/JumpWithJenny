namespace ServerAPI.Models.Authentication
{
    public class ResetPasswordRequest
    {
        public string Id { get; set; }
        public string CurrentPassword { get; set; }
        public string NewPassword { get; set; }
    }
}