using System.ComponentModel.DataAnnotations;
using ServerAPI.Models.Common;

namespace ServerAPI.Models
{
    public class WorkoutShoes : BaseDeletableModel
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string WorkoutId { get; set; }
        public Workout Workout { get; set; }

        public string ShoeId { get; set; }
        public Shoes Shoe { get; set; }

        public bool IsTaken { get; set; } // Track if a shoe is taken in this workout
    }
}