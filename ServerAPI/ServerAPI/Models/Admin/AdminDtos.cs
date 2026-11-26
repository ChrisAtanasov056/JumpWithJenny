using System.ComponentModel.DataAnnotations;
using ServerAPI.Models.Enums;
using ServerAPI.Models.Schedule;

namespace ServerAPI.Models.Admin
{
    public class AdminAddParticipantRequest
    {
        public string WorkoutId { get; set; }

        [Required]
        [MaxLength(120)]
        public string FullName { get; set; }

        [MaxLength(254)]
        public string Email { get; set; }

        [Required]
        [MaxLength(30)]
        public string PhoneNumber { get; set; }

        public ShoesSize? ShoeSize { get; set; }

        public bool UsesOwnShoes { get; set; }

        public bool SendConfirmationEmail { get; set; }

        public bool AllowOverbooking { get; set; }

        public string Language { get; set; }
    }

    public class AdminUpdateParticipantRequest
    {
        [Required]
        [MaxLength(120)]
        public string FullName { get; set; }

        [MaxLength(254)]
        public string Email { get; set; }

        [Required]
        [MaxLength(30)]
        public string PhoneNumber { get; set; }

        public ShoesSize? ShoeSize { get; set; }

        public bool UsesOwnShoes { get; set; }
    }

    public class SetAttendanceRequest
    {
        public bool IsAttended { get; set; }
    }

    public class DuplicateWorkoutRequest
    {
        public int DaysOffset { get; set; } = 7;

        public DateTime? TargetDate { get; set; }

        public int? AvailableSpots { get; set; }

        public bool CopyTrainerNote { get; set; } = false;
    }

    public class BatchWorkoutSlotItem
    {
        public DateTime Date { get; set; }

        [Required]
        public string Time { get; set; }

        [Range(1, 100)]
        public int AvailableSpots { get; set; } = 20;
    }

    public class BatchCreateWorkoutsRequest
    {
        public List<BatchWorkoutSlotItem> Slots { get; set; } = new();
    }

    public class BatchCreateWorkoutsResult
    {
        public int CreatedCount { get; set; }

        public int SkippedCount { get; set; }

        public List<AdminWorkoutViewModel> Workouts { get; set; } = new();
    }

    public class BatchAddShoesRequest
    {
        [Required]
        public ShoesSize Size { get; set; }

        [Range(1, 20)]
        public int Count { get; set; } = 1;
    }

    public class ShoesInventoryDto
    {
        public int TotalCount { get; set; }

        public int ReservedUpcomingCount { get; set; }

        public List<ShoeSizeSummaryDto> SizeSummaries { get; set; } = new();

        public List<ShoeInventoryItemDto> Items { get; set; } = new();
    }

    public class ShoeSizeSummaryDto
    {
        public ShoesSize Size { get; set; }

        public int TotalCount { get; set; }

        public int ReservedUpcomingCount { get; set; }

        public int FreeToDeleteCount { get; set; }
    }

    public class ShoeInventoryItemDto
    {
        public string Id { get; set; }

        public ShoesSize Size { get; set; }

        public DateTime CreatedOn { get; set; }

        public bool IsReservedUpcoming { get; set; }

        public int UpcomingReservationsCount { get; set; }

        public DateTime? NextReservedWorkoutDate { get; set; }
    }

    public class AdminDashboardDto
    {
        public AdminWorkoutViewModel NextWorkout { get; set; }

        public List<AdminShoePrepItemDto> NextWorkoutShoePrep { get; set; } = new();

        public int NextWorkoutOwnShoesCount { get; set; }

        public int UpcomingWorkoutsCount { get; set; }

        public int ThisWeekWorkoutsCount { get; set; }

        public int ThisWeekBookingsCount { get; set; }

        public int OccupancyRatePercent { get; set; }

        public int TotalUniqueClients { get; set; }

        public int TotalShoesCount { get; set; }

        public List<ShoeSizeSummaryDto> ShoesSummary { get; set; } = new();

        public List<AdminWorkoutViewModel> UpcomingWorkoutsPreview { get; set; } = new();

        public List<AdminRecentBookingDto> RecentBookings { get; set; } = new();
    }

    public class AdminShoePrepItemDto
    {
        public ShoesSize Size { get; set; }

        public int BookedCount { get; set; }

        public int TotalCount { get; set; }

        public int FreeCount { get; set; }
    }

    public class AdminRecentBookingDto
    {
        public string AppointmentId { get; set; }

        public string WorkoutId { get; set; }

        public string FullName { get; set; }

        public string Email { get; set; }

        public string PhoneNumber { get; set; }

        public ShoesSize? ShoeSize { get; set; }

        public bool UsesOwnShoes { get; set; }

        public bool IsAttended { get; set; }

        public DateTime CreatedOn { get; set; }

        public DateTime WorkoutDate { get; set; }

        public string WorkoutDay { get; set; }

        public string WorkoutTime { get; set; }
    }

    public class AdminClientSummaryDto
    {
        public string ClientKey { get; set; }

        public string FullName { get; set; }

        public string Email { get; set; }

        public string PhoneNumber { get; set; }

        public int TotalBookings { get; set; }

        public int UpcomingBookings { get; set; }

        public int AttendedCount { get; set; }

        public ShoesSize? PreferredShoeSize { get; set; }

        public bool UsesOwnShoesMostly { get; set; }

        public DateTime LastWorkoutDate { get; set; }

        public DateTime FirstBookingDate { get; set; }

        public List<AdminClientWorkoutItemDto> RecentWorkouts { get; set; } = new();
    }

    public class AdminClientWorkoutItemDto
    {
        public string AppointmentId { get; set; }

        public string WorkoutId { get; set; }

        public DateTime WorkoutDate { get; set; }

        public string WorkoutDay { get; set; }

        public string WorkoutTime { get; set; }

        public string WorkoutStatus { get; set; }

        public ShoesSize? ShoeSize { get; set; }

        public bool UsesOwnShoes { get; set; }

        public bool IsAttended { get; set; }
    }

    public class AdminClientAutocompleteDto
    {
        public string ClientKey { get; set; }

        public string FullName { get; set; }

        public string Email { get; set; }

        public string PhoneNumber { get; set; }

        public ShoesSize? PreferredShoeSize { get; set; }

        public bool UsesOwnShoesMostly { get; set; }

        public int TotalBookings { get; set; }
    }
}
