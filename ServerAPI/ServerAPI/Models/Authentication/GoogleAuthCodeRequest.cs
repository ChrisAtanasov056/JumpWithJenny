using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServerAPI.Models.Authentication
{
    public class GoogleAuthCodeRequest
    {
        public string Code { get; set; }
    }
}