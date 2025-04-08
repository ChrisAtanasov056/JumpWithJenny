using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ServerAPI.Models.Enums;
using ServerAPI.Services.Mapper;

namespace ServerAPI.Models.Schedule
{
    public class ShoeViewModel 
    {
        public string Id { get; set; }
        public ShoesSize Size { get; set; }
        public bool IsTaken { get; set; }
    }
}