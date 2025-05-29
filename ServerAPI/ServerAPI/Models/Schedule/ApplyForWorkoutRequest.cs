using ServerAPI.Models.Enums;

namespace ServerAPI.Models.Schedule
{
   public class ApplyForWorkoutRequest
    {
        public string WorkoutId { get; set; }
        public ShoesSize ShoeSize { get; set; }
        public CardType CardType { get; set; }
        public string UserId { get; set; }
        public bool UsesOwnShoes { get; set; } 
    }
}