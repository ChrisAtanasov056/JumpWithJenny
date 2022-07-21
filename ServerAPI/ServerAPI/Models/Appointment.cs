namespace ServerAPI.Models
{
    using ServerAPI.Models.Common;
    using System.ComponentModel.DataAnnotations;

    public class Appointment : IDeletableEntity
    {
        [Key]
        [Required]
        public string UserId { get; set; }

        public User User { get; set; }
        
        [Key]
        [Required]
        public string WorkoutId { get; set; }

        public Workout Workout { get; set; }

        public bool IsDeleted { get; set; }

        public DateTime? DeletedOn { get; set; }
    }
}
                                                                                          