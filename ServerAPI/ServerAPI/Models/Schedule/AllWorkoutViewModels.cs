namespace ServerAPI.Models.Schedule
{
    public class AllWorkoutViewModels
    {
        public ICollection<WorkoutViewModels> WorkoutViewModels { get; set; } = new List<WorkoutViewModels>();
    }
}
