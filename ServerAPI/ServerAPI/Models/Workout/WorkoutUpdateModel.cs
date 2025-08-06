namespace ServerAPI.ViewModels.Workout
{
    public class WorkoutUpdateModel
    {
        public string Id { get; set; }
        public string Day { get; set; } 
        public string Time { get; set; } 
        public int AvailableSpots { get; set; }
    }
}