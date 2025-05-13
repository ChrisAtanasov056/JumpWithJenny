using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServerAPI.Models.Authentication
{
    public class Test
    {
        public bool Success { get; set; }


        public string Token { get; set; }
        public string RefreshToken { get; set; } 

        public UserDto User { get; set; }

        public IEnumerable<string> Errors { get; set; }
    }
}