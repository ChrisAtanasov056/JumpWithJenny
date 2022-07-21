namespace ServerAPI.Services.Users
{
    using Microsoft.AspNetCore.Identity;
    using Microsoft.EntityFrameworkCore;
    using ServerAPI.Data.Common.Repositories;
    using ServerAPI.Models;
    using ServerAPI.Services.Mapper;
    using ServerAPI.ViewModels.Users;

    public class UserService : IUserService
    {
        private readonly IDeletableEntityRepository<User> usersRepository;
        private readonly UserManager<User> userManager;


        public UserService(IDeletableEntityRepository<User> usersRepository, UserManager<User> userManager)
        {
            this.usersRepository = usersRepository;
            this.userManager = userManager;
        }

        public Task<User> ChangeEmailAsync(string userId, string newEmail)
        {
            throw new NotImplementedException();
        }

        public Task<User> ChangeFirstNameAsync(string id, string firstName)
        {
            throw new NotImplementedException();
        }

        public Task<User> ChangeLastNameAsync(string id, string lastName)
        {
            throw new NotImplementedException();
        }

        public async Task<bool> ChangePasswordAsync(string Id, string currentPassword, string newPassword)
        {
            var user = await userManager.FindByIdAsync(Id);
            if (user == null)
            {
                return false;
            }

            var result = await userManager.ChangePasswordAsync(user, currentPassword, newPassword);
            return result.Succeeded;
        }

        public async Task<bool> DeleteUserAsync(string Id)
        {
            var user = await userManager.FindByIdAsync(Id);
            if (user == null)
            {
                return false;
            }

            var result = await userManager.DeleteAsync(user);
            return result.Succeeded;
        }

        public async Task<List<T>> GetAllUsersAsync<T>(int? count = null)
        {
            var users = await this.usersRepository
                .All()
                .To<T>()
                .ToListAsync();
            //if (count.HasValue)
            //{
            //    users = users.Take(count.Value).ToList();
            //}
            return users;
        }

        public Task<string> GetFirstNameAsync(string id)
        {
            throw new NotImplementedException();
        }

        public Task<string> GetLastNameAsync(string id)
        {
            throw new NotImplementedException();
        }

        public Task<string> GetProfilePicAsync(string id)
        {
            throw new NotImplementedException();
        }

        public async Task<UserViewModel> GetUserByIdAsync(string id)
        {
            var user = await this.usersRepository.GetByIdWithDeletedAsync(id);


            var userViewModel = new UserViewModel
            {
                Id = user.Id,
                Username = user.UserName,
                Email = user.Email,
                // Add other properties as needed
            };

            return userViewModel;



        }
        public async Task<T> GetUserByIdAsync<T>(string id)
        {
            throw new NotImplementedException();
        }
    }
}
