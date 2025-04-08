namespace ServerAPI.Models
{
    using ServerAPI.Models.Common;
    using ServerAPI.Models.Enums;
    using System.ComponentModel.DataAnnotations;

   public class Appointment : BaseDeletableModel
{
    [Required]
    public string UserId { get; set; }
    public User User { get; set; } // The user attending the workout

    [Required]
    public string WorkoutId { get; set; }
    public Workout Workout { get; set; } // The workout they registered for
    public CardType ?CardType { get; set; } 
    public string ShoeId { get; set; }
    public Shoes Shoe { get; set; } // The shoe booked for the workout

    public bool IsConfirmed { get; set; } = false; // Can be used to manage bookings

    public bool UsesOwnShoes { get; set; }
    }
}