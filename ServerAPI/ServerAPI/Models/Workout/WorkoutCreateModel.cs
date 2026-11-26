using System.ComponentModel.DataAnnotations;

namespace ServerAPI.ViewModels
{
    public class WorkoutCreateModel
    {
        public string Id { get; set; }
        public string Day { get; set; } 
        public string Time { get; set; } 
        public string Status { get; set; }
        public int AvailableSpots { get; set; }

        public DateTime Date { get; set; }

        [MaxLength(200)]
        public string TrainerNote { get; set; }
    }
}