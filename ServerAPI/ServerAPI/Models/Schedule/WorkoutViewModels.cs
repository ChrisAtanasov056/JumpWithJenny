namespace ServerAPI.Models.Schedule
{
    using ServerAPI.Services.Mapper;

    public class WorkoutViewModels: IMapFrom<Workout>
    {
        public string ?Id { get; set; }

        public DateTime WorkoutStart { get; set; }

        public DateTime? WorkoutEnd { get; set; }

        public int AvailableSpots { get; set; }

    }
}