using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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
      
    }
}