namespace ServerAPI.Data.Seeding.CustomSeeders
{

    using Microsoft.AspNetCore.Identity;
    using ServerAPI.Common;
    using ServerAPI.Models;
    public class AccountSeeder : ISeeder
    {
        public async Task SeedAsync(JumpWithJennyDbContext dbContext, IServiceProvider serviceProvider)
        {
            var userManager = serviceProvider.GetRequiredService<UserManager<User>>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<UserRole>>();

            // Create Roles
            await CreateRoleIfNotExists(roleManager, GlobalConstants.AdministratorRoleName);
            await CreateRoleIfNotExists(roleManager, GlobalConstants.UserRoleName);

            // Create Admin
            await CreateUser(
                userManager,
                roleManager,
                GlobalConstants.AccountsSeeding.AdminEmail,
                "Kristiyan", 
                "Atanasov",
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
            RoleManager<UserRole> roleManager,
            string email,
            string firstName,
            string lastName,
            string roleName = null)
        {
            var user = new User
            {
                UserName = email,
                Email = email,
                FirstName = firstName,
                LastName = lastName,
            };

            var password = GlobalConstants.AccountsSeeding.Password;

            if (!userManager.Users.Any(x => x.UserName == user.UserName))
            {
                var result = await userManager.CreateAsync(user, password);

                if (result.Succeeded && roleName != null)
                {
                    await userManager.AddToRoleAsync(user, roleName);
                }
            }
        }
    }
}