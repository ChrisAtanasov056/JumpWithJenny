using ServerAPI.Models;
using ServerAPI.Models.Enums;

namespace ServerAPI.ViewModels.Schedule
{
    public class ShoeViewModel
    {
        
        public ShoesSize Size { get; set; } // Enum for shoe sizes (S, M, L, XL)

        public bool IsTaken { get; set; } // Indicates if the shoes are currently in use

        public ICollection<User> UsersHistory { get; set; } 
        
    }
}