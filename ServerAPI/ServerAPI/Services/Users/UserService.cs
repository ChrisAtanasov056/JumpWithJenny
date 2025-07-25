﻿namespace ServerAPI.Services.Users
{
    using Microsoft.AspNetCore.Identity;
    using Microsoft.EntityFrameworkCore;
    using ServerAPI.Data.Common.Repositories;
    using ServerAPI.Models;
    using ServerAPI.Models.Authentication;
    using ServerAPI.Services.Mapper;
    using ServerAPI.ViewModels.Users;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;

    public class UserService : IUserService
    {
        private readonly IDeletableEntityRepository<User> usersRepository;
        private readonly UserManager<User> userManager;

        private readonly ILogger<UserService> _logger;
        public UserService(
            IDeletableEntityRepository<User> usersRepository,
            UserManager<User> userManager,
            ILogger<UserService> logger)
        {
            this.usersRepository = usersRepository;
            this.userManager = userManager;
            this._logger = logger;
        }

        public UserService(
            IDeletableEntityRepository<User> usersRepository,
            UserManager<User> userManager)
        {
            this.usersRepository = usersRepository;
            this.userManager = userManager;
        }


        public async Task<bool> DeleteUserAsync(string id)
        {
            try
            {
                var user = await this.userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return false;
                }

                // Check if user has any important relations before deleting
                var hasDependencies = await CheckUserDependenciesAsync(id);
                
                if (hasDependencies)
                {
                    // Soft delete (since you're using IDeletableEntityRepository)
                    this.usersRepository.Delete(user);
                }
                else
                {
                    // Hard delete
                    var result = await this.userManager.DeleteAsync(user);
                    if (!result.Succeeded)
                    {
                        return false;
                    }
                }

                await this.usersRepository.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                // Log the error
                Console.WriteLine($"Error deleting user: {ex.Message}");
                return false;
            }
        }

        private async Task<bool> CheckUserDependenciesAsync(string userId)
        {
            // Implement checks for any user relationships
            // Example (you'll need to access your DbContext):
            // return await _context.Appointments.AnyAsync(a => a.UserId == userId) ||
            //        await _context.Payments.AnyAsync(p => p.UserId == userId);
            
            // For now return false since we don't have access to other DbSets
            return false;
        }

        public async Task<List<T>> GetAllUsersAsync<T>(int? count = null)
        {
            var query = this.usersRepository.AllWithDeleted();
            
            if (count.HasValue)
            {
                query = query.Take(count.Value);
            }
            
            _logger.LogInformation($"Querying {count} users from the database.");

            return await query
                .OrderBy(u => u.UserName)
                .To<T>()
                .ToListAsync();
        }

        public async Task<UserAdminViewModel> GetUserByIdAsync(string id)
        {
            var user = await this.usersRepository.GetByIdWithDeletedAsync(id);
            if (user == null)
            {
                return null;
            }

            var roles = await this.userManager.GetRolesAsync(user);

            return new UserAdminViewModel
            {
                Id = user.Id,
                Username = user.UserName,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = roles.FirstOrDefault(),
            };
        }

        public async Task<T> GetUserByIdAsync<T>(string id)
        {
            return await this.usersRepository
                .AllWithDeleted()
                .Where(u => u.Id == id)
                .To<T>()
                .FirstOrDefaultAsync();
        }

        public async Task<bool> ChangePasswordAsync(string id, string currentPassword, string newPassword)
        {
            var user = await this.userManager.FindByIdAsync(id);
            if (user == null)
            {
                return false;
            }

            var result = await this.userManager.ChangePasswordAsync(user, currentPassword, newPassword);
            return result.Succeeded;
        }

        public async Task<User> ChangeEmailAsync(string userId, string newEmail)
        {
            var user = await this.userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return null;
            }

            var token = await this.userManager.GenerateChangeEmailTokenAsync(user, newEmail);
            var result = await this.userManager.ChangeEmailAsync(user, newEmail, token);

            return result.Succeeded ? user : null;
        }

        public async Task<User> ChangeFirstNameAsync(string id, string firstName)
        {
            var user = await this.usersRepository.AllWithDeleted().FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
            {
                return null;
            }

            user.FirstName = firstName;
            this.usersRepository.Update(user);
            await this.usersRepository.SaveChangesAsync();

            return user;
        }

        public async Task<User> ChangeLastNameAsync(string id, string lastName)
        {
            var user = await this.usersRepository.AllWithDeleted().FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
            {
                return null;
            }

            user.LastName = lastName;
            this.usersRepository.Update(user);
            await this.usersRepository.SaveChangesAsync();

            return user;
        }

        public async Task<string> GetFirstNameAsync(string id)
        {
            var user = await this.usersRepository.AllWithDeleted().FirstOrDefaultAsync(u => u.Id == id);
            return user?.FirstName;
        }

        public async Task<string> GetLastNameAsync(string id)
        {
            var user = await this.usersRepository.AllWithDeleted().FirstOrDefaultAsync(u => u.Id == id);
            return user?.LastName;
        }

        public async Task<string> GetProfilePicAsync(string id)
        {
            var user = await this.usersRepository.AllWithDeleted().FirstOrDefaultAsync(u => u.Id == id);
            return user?.ProfilePictureUrl;
        }

        public async Task<IEnumerable<UserSearchResultModel>> SearchUsersAsync(string query)
        {
            return await userManager.Users
                .Where(u => u.FirstName.Contains(query) ||
                            u.LastName.Contains(query) ||
                            u.Email.Contains(query))
                .Select(u => new UserSearchResultModel
                {
                    Id = u.Id,
                    FullName = u.FirstName + " " + u.LastName,
                    Email = u.Email
                })
                .Take(10)
                .ToListAsync();
        }
    } 
}