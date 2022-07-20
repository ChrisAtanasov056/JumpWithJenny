using Microsoft.AspNetCore.Identity;
using ServerAPI.Common;
using ServerAPI.Models;

namespace ServerAPI.Data.Seeding.CustomSeeders
{
    public class AccountSeeder : ISeeder
    {
        public async Task SeedAsync(JumpWithJennyDbContext dbContext, IServiceProvider serviceProvider)
        {
            var userManager = serviceProvider.GetRequiredService<UserManager<User>>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<UserRole>>();

            // Create Admin
            await CreateUser(
                userManager,
                roleManager,
                GlobalConstants.AccountsSeeding.AdminEmail,
                "Kristiyan", "Atanasov",
            GlobalConstants.AdministratorRoleName);


        }
        private static async Task CreateUser(
          UserManager<User> userManager,
          RoleManager<UserRole> roleManager,
          string email,
          string FirstName,
          string LastName,
          string roleName = null)
        {
            var user = new User
            {
                UserName = email,
                Email = email,
                FirstName = FirstName,
                LastName = LastName,
            };


            var password = GlobalConstants.AccountsSeeding.Password;

            if (roleName != null)
            {
                var role = await roleManager.FindByNameAsync(roleName);

                if (!userManager.Users.Any(x => x.UserName == user.UserName))
                {
                    var result = await userManager.CreateAsync(user, password);

                    if (result.Succeeded)
                    {
                        await userManager.AddToRoleAsync(user, roleName);
                    }
                }
            }
            else
            {
                var result = await userManager.CreateAsync(user, password);
            }
        }
    }

}

