using ServerAPI.Models.Enums;

namespace ServerAPI.Models.Schedule
{
    public class BookingCancellationDetailsDto
    {
        public string AppointmentId { get; set; }

        public string FullName { get; set; }

        public string Email { get; set; }

        public string WorkoutId { get; set; }

        public string WorkoutDay { get; set; }

        public string WorkoutTime { get; set; }

        public DateTime WorkoutDate { get; set; }

        public ShoesSize? ShoeSize { get; set; }

        public bool UsesOwnShoes { get; set; }

        public CardType CardType { get; set; }

        public bool CanCancel { get; set; }
    }
}
