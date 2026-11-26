using System.ComponentModel.DataAnnotations;

namespace ServerAPI.ViewModels.Workout
{
    public class WorkoutUpdateModel
    {
        public string Id { get; set; }
        public string Day { get; set; } 
        public string Time { get; set; }
        public DateTime Date { get; set; }
        public string Status { get; set; }
        public int AvailableSpots { get; set; }

        [MaxLength(200)]
        public string TrainerNote { get; set; }
    }
}