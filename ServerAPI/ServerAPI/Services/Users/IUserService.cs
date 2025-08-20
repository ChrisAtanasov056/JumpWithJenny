namespace ServerAPI.Services.Users
{
    using Microsoft.AspNetCore.Identity;
    using ServerAPI.Models;
    using ServerAPI.ViewModels.Users;

    public interface IUserService
    {
        Task<List<T>> GetAllUsersAsync<T>(int? count = null) where T : class, new();
        public Task<string> GetFirstNameAsync(string id);

        public Task<string> GetLastNameAsync(string id);

        public Task<User> ChangeFirstNameAsync(string id, string firstName);

        public Task<string> GetProfilePicAsync(string id);

        public Task<User> ChangeLastNameAsync(string id, string lastName);

        public Task<User> ChangeEmailAsync(string userId, string newEmail);

        public Task<UserAdminViewModel> GetUserByIdAsync(string id);

        public Task<T> GetUserByIdAsync<T>(string id);

        public Task<bool> ChangePasswordAsync(string Id, string currentPassword, string newPassword);
        public  Task<bool> DeleteUserAsync(string Id); 

        Task<IEnumerable<UserSearchResultModel>> SearchUsersAsync(string query);

        Task<IdentityResult> CreateUserAsync(UserCreateViewModel userModel);
    }
}
