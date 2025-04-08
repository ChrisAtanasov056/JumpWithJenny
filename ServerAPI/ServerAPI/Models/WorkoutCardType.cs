namespace ServerAPI.Models
{
    using System.ComponentModel.DataAnnotations;
    using ServerAPI.Models.Common;
    using ServerAPI.Models.Enums;

    public class WorkoutCardType : BaseDeletableModel
    {
        [Required]
        public CardType ?CardType { get; set; } 
    }
}