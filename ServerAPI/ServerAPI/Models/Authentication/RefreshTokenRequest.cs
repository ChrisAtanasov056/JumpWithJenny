using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServerAPI.Models.Authentication
{
    public class RefreshTokenRequest
    {
        public string RefreshToken { get; set; }
    }
}