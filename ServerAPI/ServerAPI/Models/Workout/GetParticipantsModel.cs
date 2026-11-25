using ServerAPI.Models.Enums;

namespace ServerAPI.ViewModels.Workout
{
    public class GetParticipantsModel
    {
        public string Id { get; set; }

        public string FullName { get; set; }

        public string Email { get; set; }

        public ShoesSize? ShoeSize { get; set; }

        public bool UsesOwnShoes { get; set; }

        public CardType CardType { get; set; }

        public bool IsSubscriptionCard { get; set; }
    }
}
