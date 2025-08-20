// DTOs/ShoesDTO.cs
using System.ComponentModel.DataAnnotations;
using ServerAPI.Models.Enums;

namespace ServerAPI.DTOs
{
    public class ShoesDTO
    {
        public string Id { get; set; }

        [Required]
        public ShoesSize Size { get; set; }
    }
}