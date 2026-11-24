namespace ServerAPI.Models.Authentication
{
    public class AuthResult
    {
        public bool Success { get; set; }

        public string Token { get; set; }

        public string RefreshToken { get; set; }

        public string ExpiresAt { get; set; }

        public UserDto User { get; set; }

        public IEnumerable<string> Errors { get; set; }
    }
}