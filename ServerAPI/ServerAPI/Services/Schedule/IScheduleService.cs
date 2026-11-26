namespace ServerAPI.Services.Schedule
{
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using ServerAPI.Models.Admin;
    using ServerAPI.Models.Schedule;

    public interface IScheduleService
    {
        Task<List<WorkoutViewModels>> GetAllWorkoutsAsync(int page = 1, int pageSize = 50, CancellationToken cancellationToken = default);

        Task<WorkoutViewModels> GetWorkoutByIdAsync(string id);

        Task<ApplyForWorkoutResult> ApplyForWorkoutAsync(
            ApplyForWorkoutRequest request,
            bool allowPastWorkout = false,
            bool enforceBookingLimits = true,
            bool sendConfirmationEmail = true,
            bool requireEmail = true,
            bool allowOverbooking = false);

        Task<string> UpdateParticipantAsync(string appointmentId, AdminUpdateParticipantRequest request);

        Task<bool> SetParticipantAttendanceAsync(string appointmentId, bool isAttended);

        Task<BookingCancellationDetailsDto> GetCancellationDetailsByTokenAsync(string token);

        Task<bool> CancelByTokenAsync(string token);

        Task<bool> CancelRegistrationByIdAsync(string appointmentId, bool allowPastWorkout = false);
    }
}
