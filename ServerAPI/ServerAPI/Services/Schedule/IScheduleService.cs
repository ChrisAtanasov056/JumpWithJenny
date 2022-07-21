namespace ServerAPI.Services.Schedule
{
    public interface IScheduleService
    {
        Task<List<T>> GetAllWorkoutsAsync<T>();
        Task<T> GetByIdAsync<T>(string id);
       
        //TO DO: 

        //Task DeleteAsync(string id);
        //Task<Workout> AddUserToEvent(string userId, string eventId);
        //Task AddAsync(int classId, DateTime startEvent, DateTime endEvent, int availableSpots, string description);

    }
}
