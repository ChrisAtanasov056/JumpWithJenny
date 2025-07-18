using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ServerAPI.Models;
using ServerAPI.Services.Mapper;

namespace ServerAPI.ViewModels.Users
{
    public class UserAdminViewModel
    {
        public string Id { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string Role { get; set; }
    }
}