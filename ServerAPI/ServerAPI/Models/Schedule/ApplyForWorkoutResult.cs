namespace ServerAPI.Models.Schedule
{
    public class ApplyForWorkoutResult
    {
        public WorkoutViewModels Workout { get; set; }

        public string CancellationToken { get; set; }
    }
}
