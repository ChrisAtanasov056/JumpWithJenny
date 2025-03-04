using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServerAPI.Models.Authentication
{
    public class ConfirmEmailRequest
    {
        public string ?UserId { get; set; }
        public string ?Token { get; set; }
        
    }
}