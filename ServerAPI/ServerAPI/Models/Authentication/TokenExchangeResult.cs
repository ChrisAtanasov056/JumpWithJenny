using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServerAPI.Models.Authentication
{
    public class TokenExchangeResult
    {
        public bool Success { get; set; }
        public string IdToken { get; set; }
        public string AccessToken { get; set; }
        public IEnumerable<string> Errors { get; set; }
    }
}