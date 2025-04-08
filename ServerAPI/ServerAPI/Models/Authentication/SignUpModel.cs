using ServerAPI.Services.Mapper;
using System.ComponentModel.DataAnnotations;

namespace ServerAPI.Models.Authentication
{
    public class SignUpModel 
    {
        [Required]
        [MinLength(3)]
        [MaxLength(50)]
        public string UserName { get; set; }

        [Required]
        [MinLength(3)]
        [MaxLength(50)]
        public string FirstName { get; set; }

        [Required]
        [MinLength(3)]
        [MaxLength(50)]
        public string LastName { get; set; }

        [Required]
        public string Password { get; set; }

        [Required]
        [DataType(DataType.EmailAddress)]   
        public string Email { get; set; }
    }
}
