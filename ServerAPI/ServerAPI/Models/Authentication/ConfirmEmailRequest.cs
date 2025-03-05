namespace ServerAPI.Models.Authentication
{
    public class ConfirmEmailRequest
    {
        public string ?UserId { get; set; }
        public string ?Token { get; set; }
        
    }
}