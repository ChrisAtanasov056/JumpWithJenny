using ServerAPI.Models;
using ServerAPI.Models.Enums;
using ServerAPI.Services.Mapper;

namespace ServerAPI.ViewModels.Schedule
{
    public class ShoeViewModel :  IMapFrom<Shoes>
    {
        
        public ShoesSize Size { get; set; } // Enum for shoe sizes (S, M, L, XL)

        public bool IsTaken { get; set; } // Indicates if the shoes are currently in use

        public ICollection<User> UsersHistory { get; set; } 
        
    }
}