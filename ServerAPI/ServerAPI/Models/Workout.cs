namespace ServerAPI.Models
{
    using System.ComponentModel.DataAnnotations;
    using ServerAPI.Models.Common;

    public class Workout : BaseDeletableModel
    {
        public Workout()
        {
            this.WorkoutShoes = new List<WorkoutShoes>();
            this.WorkoutCardTypes = new List<WorkoutCardType>();
            this.Appointments = new List<Appointment>(); 
        }

        [Required]
        public string Day { get; set; }

        [Required]
        public string Time { get; set; }
    
        [Required]
        public DateTime Date { get; set; }

        [Required]
        public string Status { get; set; }

        [Required]
        public int AvailableSpots { get; set; }

        public ICollection<WorkoutShoes> WorkoutShoes { get; set; }
        public ICollection<WorkoutCardType> WorkoutCardTypes { get; set; }
        public ICollection<Appointment> Appointments { get; set; }
        }
}


