﻿namespace ServerAPI.ViewModels.Users
{
    public class ChangePasswordViewModel
    {
        public string ?Id { get; set; }
        public string ?CurrentPassword { get; set; }
        public string ?NewPassword { get; set; }
    }
}