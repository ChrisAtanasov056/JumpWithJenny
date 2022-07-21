namespace ServerAPI.Services.Schedule
{
    using Microsoft.EntityFrameworkCore;
    using ServerAPI.Data;
    using ServerAPI.Data.Common.Repositories;
    using ServerAPI.Models;
    using ServerAPI.Services.Mapper;
    public class ScheduleService : IScheduleService
    {
        private readonly IDeletableEntityRepository<Workout> workoutRepository;

        public ScheduleService(IDeletableEntityRepository<Workout> workoutRepository)
        {
            this.workoutRepository = workoutRepository;
        }

        public async Task<List<T>> GetAllWorkoutsAsync<T>()
        {
            var workouts = await this.workoutRepository
                 .All()
                 .To<T>()
                 .ToListAsync();
            ;
            return workouts;
        }

        public Task<T> GetByIdAsync<T>(string id)
        {
            throw new NotImplementedException();
        }
    }
}
