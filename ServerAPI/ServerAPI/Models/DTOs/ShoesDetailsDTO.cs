// DTOs/ShoesDetailsDTO.cs

using ServerAPI.Models.Enums;
using System.Collections.Generic;

namespace ServerAPI.DTOs
{
    public class ShoesDetailsDTO
    {
        public string Id { get; set; }
        public ShoesSize Size { get; set; }
        
        public List<WorkoutDTO> Workouts { get; set; }
        public List<UserDTO> Users { get; set; }
    }
}