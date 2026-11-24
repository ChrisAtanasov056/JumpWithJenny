using ServerAPI.Models.Common;
using ServerAPI.Models.Schedule;
using ServerAPI.ViewModels;
using ServerAPI.ViewModels.Workout;

namespace ServerAPI.Services.Workouts
{
    public interface IWorkoutServices
    {
        Task<WorkoutCreateModel> CreateWorkoutAsync(WorkoutCreateModel dto);

        Task<WorkoutUpdateModel> UpdateWorkoutAsync(string id, WorkoutUpdateModel dto);

        Task DeleteWorkoutAsync(string id);

        Task<IEnumerable<GetParticipantsModel>> GetParticipantsAsync(string workoutId);

        Task<AdminWorkoutViewModel> GetWorkoutByIdAsync(string id);

        Task<IEnumerable<AdminWorkoutViewModel>> GetAllWorkoutsAsync(CancellationToken cancellationToken = default);

        Task<PagedResult<AdminWorkoutViewModel>> GetWorkoutsPagedAsync(
            int page = 1,
            int pageSize = 20,
            bool? upcomingOnly = null,
            string search = null,
            CancellationToken cancellationToken = default);
    }
}