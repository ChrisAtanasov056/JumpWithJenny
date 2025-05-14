namespace ServerAPI.Models
{
    using ServerAPI.Models.Common;
    using ServerAPI.Models.Enums;
    using System.ComponentModel.DataAnnotations;

   public class Appointment : BaseDeletableModel
{
    [Required]
    public string UserId { get; set; }
    public User User { get; set; } 

    [Required]
    public string WorkoutId { get; set; }
    public Workout Workout { get; set; } 
    public CardType ?CardType { get; set; } 
    public string ShoeId { get; set; }
    public Shoes Shoe { get; set; }

    public bool IsConfirmed { get; set; } = false; 
    
    public bool UsesOwnShoes { get; set; }
    }
}