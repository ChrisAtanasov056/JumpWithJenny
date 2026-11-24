namespace ServerAPI.Services.Users
{
    using Microsoft.AspNetCore.Identity;
    using Microsoft.EntityFrameworkCore;
    using ServerAPI.Common;
    using ServerAPI.Data;
    using ServerAPI.Data.Common.Repositories;
    using ServerAPI.Models;
    using ServerAPI.Services.AuthService;
    using ServerAPI.ViewModels.Users;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Reflection;
    using System.Threading.Tasks;

    public class UserService : IUserService
    {
        private readonly IDeletableEntityRepository<User> usersRepository;
        private readonly UserManager<User> userManager;
        private readonly JumpWithJennyDbContext _context;
        private readonly ILogger<UserService> _logger;

        public UserService(
            IDeletableEntityRepository<User> usersRepository,
            UserManager<User> userManager,
            ILogger<UserService> logger,
            JumpWithJennyDbContext context)
        {
            this.usersRepository = usersRepository;
            this.userManager = userManager;
            this._logger = logger;
            this._context = context;
        }

        public async Task<bool> DeleteUserAsync(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return false;
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
                if (user == null)
                {
                    return false;
                }

                if (await this.userManager.IsInRoleAsync(user, GlobalConstants.AdministratorRoleName))
                {
                    var admins = await this.userManager.GetUsersInRoleAsync(GlobalConstants.AdministratorRoleName);
                    if (!admins.Any(a => !a.IsDeleted && a.Id != id))
                    {
                        throw new InvalidOperationException("Cannot delete the last administrator account.");
                    }
                }

                var nowSofia = BulgariaTimeHelper.GetCurrentSofiaTime();
                var utcNow = DateTime.UtcNow;

                var upcomingAppointments = await _context.Appointments
                    .Where(a => a.UserId == id && a.Workout.Date > nowSofia)
                    .Include(a => a.Workout)
                        .ThenInclude(w => w.WorkoutShoes)
                    .ToListAsync();

                foreach (var appointment in upcomingAppointments)
                {
                    if (appointment.Workout != null)
                    {
                        appointment.Workout.AvailableSpots += 1;
                        if (string.Equals(appointment.Workout.Status, "Booked", StringComparison.OrdinalIgnoreCase) &&
                            appointment.Workout.AvailableSpots > 0)
                        {
                            appointment.Workout.Status = "Available";
                        }

                        if (!string.IsNullOrEmpty(appointment.ShoeId))
                        {
                            var workoutShoe = appointment.Workout.WorkoutShoes?
                                .FirstOrDefault(ws => ws.ShoeId == appointment.ShoeId);
                            if (workoutShoe != null)
                            {
                                workoutShoe.IsTaken = false;
                            }
                        }
                    }

                    appointment.IsDeleted = true;
                    appointment.DeletedOn = utcNow;
                }

                await RefreshTokenHelper.RevokeActiveRefreshTokensAsync(_context, user.Id);

                var userLogins = await _context.UserLogins
                    .Where(l => l.UserId == user.Id)
                    .ToListAsync();
                if (userLogins.Count > 0)
                {
                    _context.UserLogins.RemoveRange(userLogins);
                }

                var deletedTag = $"deleted_{user.Id}";
                user.IsDeleted = true;
                user.DeletedOn = utcNow;
                user.LockoutEnabled = true;
                user.LockoutEnd = DateTimeOffset.MaxValue;
                user.EmailConfirmed = false;
                user.SecurityStamp = Guid.NewGuid().ToString();
                user.UserName = deletedTag;
                user.NormalizedUserName = deletedTag.ToUpperInvariant();
                user.Email = $"{deletedTag}@deleted.local";
                user.NormalizedEmail = user.Email.ToUpperInvariant();

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return true;
            }
            catch (InvalidOperationException)
            {
                await transaction.RollbackAsync();
                throw;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error deleting user {UserId}", id);
                return false;
            }
        }

        public async Task<UserAdminViewModel> UpdateUserAsync(string id, UserUpdateViewModel model, string actingUserId = null)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                throw new ArgumentException("User ID is required.");
            }

            if (model == null)
            {
                throw new ArgumentException("User payload is required.");
            }

            var normalizedUsername = model.Username?.Trim();
            var normalizedEmail = model.Email?.Trim();
            var normalizedFirstName = model.FirstName?.Trim();
            var normalizedLastName = model.LastName?.Trim() ?? string.Empty;
            var normalizedRole = model.Role?.Trim();

            if (string.IsNullOrWhiteSpace(normalizedUsername))
            {
                throw new ArgumentException("Username is required.");
            }

            if (string.IsNullOrWhiteSpace(normalizedEmail))
            {
                throw new ArgumentException("Email is required.");
            }

            if (string.IsNullOrWhiteSpace(normalizedFirstName))
            {
                throw new ArgumentException("First name is required.");
            }

            if (string.IsNullOrWhiteSpace(normalizedRole))
            {
                throw new ArgumentException("Role is required.");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
            {
                throw new KeyNotFoundException("User not found.");
            }

            var roleEntity = await _context.Roles.FirstOrDefaultAsync(r => r.Name == normalizedRole);
            if (roleEntity == null)
            {
                throw new ArgumentException($"Role '{normalizedRole}' does not exist.");
            }

            var currentRoles = await this.userManager.GetRolesAsync(user);
            var isCurrentlyAdmin = currentRoles.Any(r =>
                string.Equals(r, GlobalConstants.AdministratorRoleName, StringComparison.OrdinalIgnoreCase));
            var willBeAdmin = string.Equals(roleEntity.Name, GlobalConstants.AdministratorRoleName, StringComparison.OrdinalIgnoreCase);

            if (isCurrentlyAdmin && !willBeAdmin)
            {
                if (!string.IsNullOrEmpty(actingUserId) && actingUserId == id)
                {
                    throw new InvalidOperationException("You cannot remove your own Administrator role.");
                }

                var admins = await this.userManager.GetUsersInRoleAsync(GlobalConstants.AdministratorRoleName);
                if (!admins.Any(a => !a.IsDeleted && a.Id != id))
                {
                    throw new InvalidOperationException("Cannot demote the last administrator account.");
                }
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                if (!string.Equals(user.UserName, normalizedUsername, StringComparison.Ordinal))
                {
                    var setUsernameResult = await this.userManager.SetUserNameAsync(user, normalizedUsername);
                    if (!setUsernameResult.Succeeded)
                    {
                        throw new ArgumentException(string.Join("; ", setUsernameResult.Errors.Select(e => e.Description)));
                    }
                }

                var wasEmailConfirmed = user.EmailConfirmed;
                if (!string.Equals(user.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase))
                {
                    var setEmailResult = await this.userManager.SetEmailAsync(user, normalizedEmail);
                    if (!setEmailResult.Succeeded)
                    {
                        throw new ArgumentException(string.Join("; ", setEmailResult.Errors.Select(e => e.Description)));
                    }

                    user.EmailConfirmed = wasEmailConfirmed;
                }

                user.FirstName = normalizedFirstName;
                user.LastName = normalizedLastName;

                var updateResult = await this.userManager.UpdateAsync(user);
                if (!updateResult.Succeeded)
                {
                    throw new ArgumentException(string.Join("; ", updateResult.Errors.Select(e => e.Description)));
                }

                var rolesChanged = !currentRoles.SequenceEqual(new[] { roleEntity.Name });
                if (rolesChanged)
                {
                    if (currentRoles.Count > 0)
                    {
                        var removeRolesResult = await this.userManager.RemoveFromRolesAsync(user, currentRoles);
                        if (!removeRolesResult.Succeeded)
                        {
                            throw new ArgumentException(string.Join("; ", removeRolesResult.Errors.Select(e => e.Description)));
                        }
                    }

                    var addRoleResult = await this.userManager.AddToRoleAsync(user, roleEntity.Name);
                    if (!addRoleResult.Succeeded)
                    {
                        throw new ArgumentException(string.Join("; ", addRoleResult.Errors.Select(e => e.Description)));
                    }

                    await RefreshTokenHelper.RevokeActiveRefreshTokensAsync(_context, user.Id);
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                return new UserAdminViewModel
                {
                    Id = user.Id,
                    Username = user.UserName,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Role = roleEntity.Name,
                };
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

       public async Task<List<T>> GetAllUsersAsync<T>(int? count = null) where T : class, new()
        {
            var query = this.usersRepository.All();

            if (count.HasValue)
            {
                query = query.Take(count.Value);
            }

            _logger.LogInformation("Querying {Count} active users from the database.", count);

            var users = await query
                .OrderBy(u => u.UserName)
                .ToListAsync();

            var result = new List<T>();

            foreach (var user in users)
            {
                var roles = await userManager.GetRolesAsync(user);
                var role = roles.FirstOrDefault() ?? "No Role";

                var obj = new T();
                var userProperties = typeof(User).GetProperties();
                var targetProperties = typeof(T).GetProperties();

                foreach (var targetProp in targetProperties)
                {
                    if (targetProp.Name.Equals("Role", StringComparison.OrdinalIgnoreCase) &&
                        targetProp.PropertyType == typeof(string))
                    {
                        targetProp.SetValue(obj, role);
                        continue;
                    }

                    PropertyInfo sourceProp = null;

                    // специално за Username
                    if (targetProp.Name.Equals("Username", StringComparison.OrdinalIgnoreCase))
                    {
                        sourceProp = userProperties.FirstOrDefault(p => p.Name.Equals("UserName", StringComparison.OrdinalIgnoreCase));
                    }
                    else
                    {
                        sourceProp = userProperties.FirstOrDefault(p => p.Name == targetProp.Name &&
                                                                        p.PropertyType == targetProp.PropertyType);
                    }

                    if (sourceProp != null)
                    {
                        var value = sourceProp.GetValue(user);
                        targetProp.SetValue(obj, value);
                    }
                }


                result.Add(obj);
            }

            return result;
        }



        public async Task<UserAdminViewModel> GetUserByIdAsync(string id)
        {
            var user = await this.usersRepository.All().FirstOrDefaultAsync(u => u.Id == id);
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

        public async Task<bool> ChangePasswordAsync(string id, string currentPassword, string newPassword)
        {
            var user = await this.userManager.FindByIdAsync(id);
            if (user == null)
            {
                return false;
            }

            var result = await this.userManager.ChangePasswordAsync(user, currentPassword, newPassword);
            if (!result.Succeeded)
            {
                return false;
            }

            if (this._context != null)
            {
                await RefreshTokenHelper.RevokeActiveRefreshTokensAsync(this._context, user.Id);
                await this._context.SaveChangesAsync();
            }

            return true;
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
            var user = await this.usersRepository.All().FirstOrDefaultAsync(u => u.Id == id);
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
            var user = await this.usersRepository.All().FirstOrDefaultAsync(u => u.Id == id);
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
            var user = await this.usersRepository.All().FirstOrDefaultAsync(u => u.Id == id);
            return user?.FirstName;
        }

        public async Task<string> GetLastNameAsync(string id)
        {
            var user = await this.usersRepository.All().FirstOrDefaultAsync(u => u.Id == id);
            return user?.LastName;
        }

        public async Task<string> GetProfilePicAsync(string id)
        {
            var user = await this.usersRepository.All().FirstOrDefaultAsync(u => u.Id == id);
            return user?.ProfilePictureUrl;
        }

        public async Task<IEnumerable<UserSearchResultModel>> SearchUsersAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return Enumerable.Empty<UserSearchResultModel>();
            }

            var term = query.Trim().ToLower();

            return await userManager.Users
                .Where(u => (u.FirstName != null && u.FirstName.ToLower().Contains(term)) ||
                            (u.LastName != null && u.LastName.ToLower().Contains(term)) ||
                            (u.Email != null && u.Email.ToLower().Contains(term)))
                .Select(u => new UserSearchResultModel
                {
                    Id = u.Id,
                    FullName = u.FirstName + " " + u.LastName,
                    Email = u.Email
                })
                .Take(10)
                .ToListAsync();
        }
    
        public async Task<IdentityResult> CreateUserAsync(UserCreateViewModel userModel)
        {
            var user = new User
            {
                UserName = userModel.Username,
                Email = userModel.Email,
                FirstName = userModel.FirstName,
                LastName = userModel.LastName,
            };
            
            var result = await userManager.CreateAsync(user, userModel.Password);
            
            if (result.Succeeded)
            {
                // Find and assign the role
                var roleExists = await _context.Roles.AnyAsync(r => r.Name == userModel.Role);
                if (roleExists)
                {
                    await userManager.AddToRoleAsync(user, userModel.Role);
                }
                else
                {
                    // This is a critical step: if the role doesn't exist, we must handle it.
                    // Throwing an exception here prevents creating a user without a role.
                    await userManager.DeleteAsync(user); // Clean up the created user
                    throw new ArgumentException($"Role '{userModel.Role}' does not exist.");
                }
            }
            return result;
        }
    } 

}