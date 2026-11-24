namespace ServerAPI.Data.Seeding.CustomSeeders
{

    using Microsoft.AspNetCore.Identity;
    using Microsoft.EntityFrameworkCore;
    using Microsoft.Extensions.Configuration;
    using Microsoft.Extensions.DependencyInjection;
    using Microsoft.Extensions.Hosting;
    using Microsoft.Extensions.Logging;
    using ServerAPI.Common;
    using ServerAPI.Models;

    public class AccountSeeder : ISeeder
    {
        public async Task SeedAsync(JumpWithJennyDbContext dbContext, IServiceProvider serviceProvider)
        {
            var userManager = serviceProvider.GetRequiredService<UserManager<User>>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<UserRole>>();
            var environment = serviceProvider.GetRequiredService<IHostEnvironment>();
            var configuration = serviceProvider.GetRequiredService<IConfiguration>();
            var logger = serviceProvider.GetRequiredService<ILogger<AccountSeeder>>();

            // Create Roles
            await CreateRoleIfNotExists(roleManager, GlobalConstants.AdministratorRoleName);
            await CreateRoleIfNotExists(roleManager, GlobalConstants.UserRoleName);

            if (!environment.IsDevelopment())
            {
                logger.LogInformation("Skipping default administrator seeding outside Development environment.");
                return;
            }

            var email = configuration["SeedAdmin:Email"];
            var password = configuration["SeedAdmin:Password"];
            var firstName = configuration["SeedAdmin:FirstName"] ?? "Admin";
            var lastName = configuration["SeedAdmin:LastName"] ?? "User";

            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            {
                logger.LogInformation("SeedAdmin:Email or SeedAdmin:Password is not configured; skipping default administrator seeding.");
                return;
            }

            // Create Admin
            await CreateUser(
                userManager,
                email,
                password,
                firstName,
                lastName,
                GlobalConstants.AdministratorRoleName);
        }

        private static async Task CreateRoleIfNotExists(RoleManager<UserRole> roleManager, string roleName)
        {
            var roleExists = await roleManager.RoleExistsAsync(roleName);
            if (!roleExists)
            {
                await roleManager.CreateAsync(new UserRole(roleName));
            }
        }

        private static async Task CreateUser(
            UserManager<User> userManager,
            string email,
            string password,
            string firstName,
            string lastName,
            string roleName = null)
        {
            var userExists = await userManager.Users.AnyAsync(x => x.UserName == email || x.Email == email);
            if (userExists)
            {
                return;
            }

            var user = new User
            {
                UserName = email,
                Email = email,
                FirstName = firstName,
                LastName = lastName,
                EmailConfirmed = true,
            };

            var result = await userManager.CreateAsync(user, password);

            if (result.Succeeded && roleName != null)
            {
                await userManager.AddToRoleAsync(user, roleName);
            }
        }
    }
}