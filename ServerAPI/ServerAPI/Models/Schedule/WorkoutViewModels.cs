namespace ServerAPI.Models.Schedule
{
    using ServerAPI.Services.Mapper;
    using ServerAPI.Models.Common;

    public class WorkoutViewModels : IMapFrom<Workout>
    {
        public string Id { get; set; }
        public string Day { get; set; } 
        public string Time { get; set; } 
        public string Status { get; set; } 
        public int AvailableSpots { get; set; }

        // Only relevant shoe details
        //public List<int> ShoesIds { get; set; } = new List<int>();

       public ICollection<WorkoutShoes> WorkoutShoes { get; set; } = new List<WorkoutShoes>();

        // Added WorkoutCardTypes to be more complete
        // public ICollection<string> WorkoutCardTypes { get; set; } = new List<string>();
    }
    
}