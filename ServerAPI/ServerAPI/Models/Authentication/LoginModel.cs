﻿

namespace ServerAPI.Models.Authentication
{
    using System.ComponentModel.DataAnnotations;
    public class LoginModel
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email address")]
        public string ?Email { get; set; }

        [Required(ErrorMessage = "Password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters long")]
        public string ?Password { get; set; }
    }
}
