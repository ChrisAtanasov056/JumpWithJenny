namespace ServerAPI.ViewModels
{
    public class WorkoutCreateModel
    {
        public string Id { get; set; }
        public string Day { get; set; } 
        public string Time { get; set; } 
        public string Status { get; set; }
        public int AvailableSpots { get; set; }
    }
}