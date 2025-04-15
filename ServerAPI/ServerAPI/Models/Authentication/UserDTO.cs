using ServerAPI.Services.Mapper;

namespace ServerAPI.Models.Authentication
{
    public class UserDto : IMapFrom<User>
    {
        public string id { get; set; }
        public string email { get; set; }
        public string username { get; set; }
        public string firstname { get; set; }
        public string lastname { get; set; }
        public bool emailConfirmed { get; set; }
        public string role { get; set; }
    }
}