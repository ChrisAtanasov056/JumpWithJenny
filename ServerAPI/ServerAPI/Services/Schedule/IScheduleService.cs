namespace ServerAPI.Services.Schedule
{
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using ServerAPI.Models;
    using ServerAPI.Models.Enums;
    using ServerAPI.Models.Schedule;

    public interface IScheduleService
    {
        Task<List<WorkoutViewModels>> GetAllWorkoutsAsync();
        Task<WorkoutViewModels> GetWorkoutByIdAsync(string id);
        Task<Workout> ApplyForWorkoutAsync(string workoutId, ShoesSize? shoeSize, CardType cardType, string userId, bool usesOwnShoes);
        Task<bool> IsUserRegisteredAsync(string workoutId, string userId);
        Task<bool> CancelRegistrationAsync(string workoutId, string userId);
    }
}