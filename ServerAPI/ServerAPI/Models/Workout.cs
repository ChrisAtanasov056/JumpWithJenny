namespace ServerAPI.Models
{
    using ServerAPI.Models.Common;
    using System.ComponentModel.DataAnnotations;

    public class Workout : BaseDeletableModel
    {
        public Workout()
        {
            this.WorkoutEnd = WorkoutStart.AddHours(1);
            this.Appointments = new List<Appointment>();
            this.Shoes = new List<Shoes>();
            this.AvailableSpots = Shoes
                .Where(x => x.IsTaken == true)
                .ToList()
                .Count;
        }

        [Required]
        public DateTime WorkoutStart { get; set; }

        public DateTime? WorkoutEnd { get; set; }

        public int AvailableSpots { get; set; }

        public ICollection<Appointment> Appointments { get; set; }

        public ICollection<Shoes> Shoes { get; set; }
    }
}
