namespace ServerAPI.ViewModels.Users
{
    using System.ComponentModel.DataAnnotations;

    public class UserUpdateViewModel
    {
        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string Username { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(256)]
        public string Email { get; set; }

        [Required]
        [StringLength(50)]
        public string FirstName { get; set; }

        [StringLength(50)]
        public string LastName { get; set; }

        [Required]
        public string Role { get; set; }
    }
}
