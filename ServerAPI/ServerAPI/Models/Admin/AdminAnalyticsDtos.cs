using ServerAPI.Models.Enums;

namespace ServerAPI.Models.Admin
{
    public class AdminAnalyticsDto
    {
        public string Range { get; set; }

        public DateTime? StartDateUtc { get; set; }

        public DateTime? EndDateUtc { get; set; }

        public bool HasPreviousPeriod { get; set; }

        public AnalyticsKpiSummaryDto Kpis { get; set; } = new();

        public List<AnalyticsTrendPointDto> Trend { get; set; } = new();

        public List<AnalyticsSlotItemDto> TopTimeSlots { get; set; } = new();

        public List<AnalyticsWeekdayItemDto> WeekdayBreakdown { get; set; } = new();

        public AnalyticsLeadTimeDto LeadTime { get; set; } = new();

        public AnalyticsShoesDemandDto ShoesDemand { get; set; } = new();

        public List<AdminClientSummaryDto> TopClients { get; set; } = new();

        public List<AnalyticsInactiveClientDto> InactiveRegulars { get; set; } = new();
    }

    public class AnalyticsKpiSummaryDto
    {
        public int TotalWorkouts { get; set; }

        public int PreviousTotalWorkouts { get; set; }

        public int CancelledWorkouts { get; set; }

        public int TotalBookings { get; set; }

        public int PreviousTotalBookings { get; set; }

        public double AverageBookingsPerWorkout { get; set; }

        public double PreviousAverageBookingsPerWorkout { get; set; }

        public int OccupancyRatePercent { get; set; }

        public int PreviousOccupancyRatePercent { get; set; }

        public int AttendanceRatePercent { get; set; }

        public int AttendedCount { get; set; }

        public int PastBookingsCount { get; set; }

        public int NoShowCount { get; set; }

        public int NewClientsCount { get; set; }

        public int PreviousNewClientsCount { get; set; }

        public int ReturningClientsCount { get; set; }

        public int RetentionRatePercent { get; set; }

        public int CancelledBookingsCount { get; set; }

        public int CancellationRatePercent { get; set; }

        public int LateCancellationsCount { get; set; }
    }

    public class AnalyticsTrendPointDto
    {
        public string Label { get; set; }

        public DateTime BucketStartUtc { get; set; }

        public int WorkoutsCount { get; set; }

        public int BookingsCount { get; set; }

        public int AttendedCount { get; set; }

        public int CapacityCount { get; set; }

        public int OccupancyPercent { get; set; }
    }

    public class AnalyticsSlotItemDto
    {
        public string Day { get; set; }

        public string Time { get; set; }

        public int WorkoutsCount { get; set; }

        public int TotalBookings { get; set; }

        public int TotalCapacity { get; set; }

        public double AverageBookings { get; set; }

        public int OccupancyPercent { get; set; }
    }

    public class AnalyticsWeekdayItemDto
    {
        public string Day { get; set; }

        public int WorkoutsCount { get; set; }

        public int TotalBookings { get; set; }

        public int TotalCapacity { get; set; }

        public int OccupancyPercent { get; set; }
    }

    public class AnalyticsLeadTimeDto
    {
        public double AverageHoursBefore { get; set; }

        public int SameDayCount { get; set; }

        public int OneToTwoDaysCount { get; set; }

        public int ThreeToSevenDaysCount { get; set; }

        public int OverSevenDaysCount { get; set; }

        public int TotalMeasured { get; set; }
    }

    public class AnalyticsShoesDemandDto
    {
        public int OwnShoesBookingsCount { get; set; }

        public int StudioShoesBookingsCount { get; set; }

        public int OwnShoesSharePercent { get; set; }

        public List<AnalyticsShoeSizeItemDto> Sizes { get; set; } = new();
    }

    public class AnalyticsShoeSizeItemDto
    {
        public ShoesSize Size { get; set; }

        public int InventoryCount { get; set; }

        public int BookingsCount { get; set; }

        public int SharePercent { get; set; }

        public int SoldOutWorkoutsCount { get; set; }

        public int SoldOutRatePercent { get; set; }
    }

    public class AnalyticsInactiveClientDto
    {
        public string ClientKey { get; set; }

        public string FullName { get; set; }

        public string PhoneNumber { get; set; }

        public string Email { get; set; }

        public int TotalBookings { get; set; }

        public int AttendedCount { get; set; }

        public DateTime LastWorkoutDate { get; set; }

        public int DaysSinceLastWorkout { get; set; }
    }
}
