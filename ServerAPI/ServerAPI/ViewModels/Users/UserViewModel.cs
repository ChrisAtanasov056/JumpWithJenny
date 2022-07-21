namespace ServerAPI.ViewModels.Users
{
    using ServerAPI.Models;
    using ServerAPI.Services.Mapper;

    public class UserViewModel : IMapFrom<User>
    {
        public string Id { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        
    }
}
