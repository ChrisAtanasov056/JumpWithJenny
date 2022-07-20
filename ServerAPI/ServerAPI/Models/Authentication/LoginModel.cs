using ServerAPI.Services.Mapper;
using System.ComponentModel.DataAnnotations;

namespace ServerAPI.Models.Authentication
{
    public class LoginModel   
    {
        [Required]
        public string? Username { get; set; }
        [Required]
        public string? Password { get; set; }

    }
}
