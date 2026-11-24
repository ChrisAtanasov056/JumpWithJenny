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
    using System.Threading;
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
                    if (!await HasAnotherActiveAdministratorAsync(id))
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

                if (!await HasAnotherActiveAdministratorAsync(id))
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

        public async Task<List<UserViewModel>> GetAllUsersAsync(int? count = null, CancellationToken cancellationToken = default)
        {
            var query = _context.Users
                .AsNoTracking()
                .OrderBy(u => u.UserName)
                .Select(u => new UserViewModel
                {
                    Id = u.Id,
                    Username = u.UserName,
                    Email = u.Email,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Role = _context.UserRoles
                        .Where(ur => ur.UserId == u.Id)
                        .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
                        .FirstOrDefault() ?? "No Role",
                });

            if (count.HasValue)
            {
                query = query.Take(Math.Max(0, count.Value));
            }

            _logger.LogInformation("Querying active users (limit: {Count}) from the database.", count);

            return await query.ToListAsync(cancellationToken);
        }

        public async Task<AllUsersViewModels> GetUsersPagedAsync(
            int page = 1,
            int pageSize = 50,
            string search = null,
            CancellationToken cancellationToken = default)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var baseQuery = _context.Users.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                baseQuery = baseQuery.Where(u =>
                    (u.UserName != null && u.UserName.ToLower().Contains(term)) ||
                    (u.Email != null && u.Email.ToLower().Contains(term)) ||
                    (u.FirstName != null && u.FirstName.ToLower().Contains(term)) ||
                    (u.LastName != null && u.LastName.ToLower().Contains(term)) ||
                    _context.UserRoles
                        .Where(ur => ur.UserId == u.Id)
                        .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
                        .Any(roleName => roleName != null && roleName.ToLower().Contains(term)));
            }

            var totalCount = await baseQuery.CountAsync(cancellationToken);

            var users = await baseQuery
                .OrderBy(u => u.UserName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new UserViewModel
                {
                    Id = u.Id,
                    Username = u.UserName,
                    Email = u.Email,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Role = _context.UserRoles
                        .Where(ur => ur.UserId == u.Id)
                        .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
                        .FirstOrDefault() ?? "No Role",
                })
                .ToListAsync(cancellationToken);

            return new AllUsersViewModels
            {
                Users = users,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
            };
        }

        public async Task<UserAdminViewModel> GetUserByIdAsync(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return null;
            }

            return await _context.Users
                .AsNoTracking()
                .Where(u => u.Id == id)
                .Select(u => new UserAdminViewModel
                {
                    Id = u.Id,
                    Username = u.UserName,
                    Email = u.Email,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Role = _context.UserRoles
                        .Where(ur => ur.UserId == u.Id)
                        .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
                        .FirstOrDefault(),
                })
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

        public Task<string> GetFirstNameAsync(string id)
        {
            return this.usersRepository.AllAsNoTracking()
                .Where(u => u.Id == id)
                .Select(u => u.FirstName)
                .FirstOrDefaultAsync();
        }

        public Task<string> GetLastNameAsync(string id)
        {
            return this.usersRepository.AllAsNoTracking()
                .Where(u => u.Id == id)
                .Select(u => u.LastName)
                .FirstOrDefaultAsync();
        }

        public Task<string> GetProfilePicAsync(string id)
        {
            return this.usersRepository.AllAsNoTracking()
                .Where(u => u.Id == id)
                .Select(u => u.ProfilePictureUrl)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<UserSearchResultModel>> SearchUsersAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return Enumerable.Empty<UserSearchResultModel>();
            }

            var term = query.Trim().ToLower();

            return await _context.Users
                .AsNoTracking()
                .Where(u => (u.FirstName != null && u.FirstName.ToLower().Contains(term)) ||
                            (u.LastName != null && u.LastName.ToLower().Contains(term)) ||
                            (u.Email != null && u.Email.ToLower().Contains(term)))
                .OrderBy(u => u.FirstName)
                .ThenBy(u => u.LastName)
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

        private Task<bool> HasAnotherActiveAdministratorAsync(string excludedUserId)
        {
            var normalizedAdminRole = GlobalConstants.AdministratorRoleName.ToUpperInvariant();

            return _context.UserRoles
                .AsNoTracking()
                .Join(
                    _context.Roles,
                    ur => ur.RoleId,
                    r => r.Id,
                    (ur, r) => new { ur.UserId, r.NormalizedName })
                .Join(
                    _context.Users,
                    x => x.UserId,
                    u => u.Id,
                    (x, u) => new { u.Id, u.IsDeleted, x.NormalizedName })
                .AnyAsync(x =>
                    x.NormalizedName == normalizedAdminRole &&
                    !x.IsDeleted &&
                    x.Id != excludedUserId);
        }
    }

}