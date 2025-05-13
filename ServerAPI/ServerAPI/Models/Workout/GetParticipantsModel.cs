using System.Drawing;
using ServerAPI.Models.Enums;

namespace ServerAPI.ViewModels.Workout
{
    public class GetParticipantsModel
    {
        public string Id { get; set; }

        public string FirstName { get; set; }
        public string LastName { get; set; }

        public string Email { get; set; }

        public ShoesSize ShoeSize { get; set; }

    }
}