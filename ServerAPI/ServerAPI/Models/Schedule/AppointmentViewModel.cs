using ServerAPI.Models.Enums;

namespace ServerAPI.Models.Schedule
{
    public class AppointmentViewModel
    {
        public string Id { get; set; }

        public string UserId { get; set; }

        public string UserFullName { get; set; }

        public string UserEmail { get; set; }

        public string PhoneNumber { get; set; }

        public string ShoeId { get; set; }

        public ShoesSize? ShoeSize { get; set; }

        public bool UsesOwnShoes { get; set; }
    }
}
