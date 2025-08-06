using System.ComponentModel.DataAnnotations;

namespace ServerAPI.Models.Authentication
{
    public class SignUpModel 
    {
        
        public string UserName { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string Password { get; set; }
  
        public string Email { get; set; }

        public string Language { get; set; }
    }
}
