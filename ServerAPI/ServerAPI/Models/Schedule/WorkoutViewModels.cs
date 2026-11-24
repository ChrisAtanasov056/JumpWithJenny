namespace ServerAPI.Models.Schedule
{
    public class WorkoutViewModels
    {
        public string Id { get; set; }
        public string Day { get; set; } 
        public string Time { get; set; } 
        public string Status { get; set; } 
        public int AvailableSpots { get; set; }

        public DateTime Date { get; set; }

        // Only relevant shoe details
        //public List<int> ShoesIds { get; set; } = new List<int>();

       public ICollection<WorkoutShoes> WorkoutShoes { get; set; } = new List<WorkoutShoes>();

        // Added WorkoutCardTypes to be more complete
        // public ICollection<string> WorkoutCardTypes { get; set; } = new List<string>();
    }
    
}