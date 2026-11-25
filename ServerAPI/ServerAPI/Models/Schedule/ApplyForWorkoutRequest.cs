using ServerAPI.Models.Enums;

namespace ServerAPI.Models.Schedule
{
    public class ApplyForWorkoutRequest
    {
        public string WorkoutId { get; set; }

        public string FullName { get; set; }

        public string Email { get; set; }

        public ShoesSize? ShoeSize { get; set; }

        public bool UsesOwnShoes { get; set; }

        public CardType? CardType { get; set; }

        public string Language { get; set; }
    }
}
