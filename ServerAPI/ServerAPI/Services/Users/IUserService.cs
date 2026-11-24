namespace ServerAPI.Services.Users
{
    using Microsoft.AspNetCore.Identity;
    using ServerAPI.Models;
    using ServerAPI.ViewModels.Users;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;

    public interface IUserService
    {
        Task<List<UserViewModel>> GetAllUsersAsync(int? count = null, CancellationToken cancellationToken = default);

        Task<AllUsersViewModels> GetUsersPagedAsync(int page = 1, int pageSize = 50, string search = null, CancellationToken cancellationToken = default);

        Task<string> GetFirstNameAsync(string id);

        Task<string> GetLastNameAsync(string id);

        Task<User> ChangeFirstNameAsync(string id, string firstName);

        Task<string> GetProfilePicAsync(string id);

        Task<User> ChangeLastNameAsync(string id, string lastName);

        Task<User> ChangeEmailAsync(string userId, string newEmail);

        Task<UserAdminViewModel> GetUserByIdAsync(string id);

        Task<bool> ChangePasswordAsync(string id, string currentPassword, string newPassword);

        Task<UserAdminViewModel> UpdateUserAsync(string id, UserUpdateViewModel model, string actingUserId = null);

        Task<bool> DeleteUserAsync(string id);

        Task<IEnumerable<UserSearchResultModel>> SearchUsersAsync(string query);

        Task<IdentityResult> CreateUserAsync(UserCreateViewModel userModel);
    }
}
