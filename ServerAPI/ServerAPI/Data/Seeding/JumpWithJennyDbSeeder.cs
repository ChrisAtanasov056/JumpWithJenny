namespace ServerAPI.Data.Seeding
{
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using Microsoft.Extensions.DependencyInjection;
    using Microsoft.Extensions.Logging;
    using ServerAPI.Data.Seeding.CustomSeeders;

    public class JumpWithJennyDbSeeder : ISeeder
    {
        public async Task SeedAsync(JumpWithJennyDbContext dbContext, IServiceProvider serviceProvider)
        {
            if (dbContext == null)
            {
                throw new ArgumentNullException(nameof(dbContext));
            }

            if (serviceProvider == null)
            {
                throw new ArgumentNullException(nameof(serviceProvider));
            }

            var logger = serviceProvider.GetService<ILoggerFactory>().CreateLogger(typeof(JumpWithJennyDbSeeder));

            var seeders = new List<ISeeder>
                          {
                              new RolesSeeder(),
                              new ShoesSeeder(),
                              new WorkoutSeeder(),
                              new AccountSeeder()
                          };

            foreach (var seeder in seeders)
            {
                await seeder.SeedAsync(dbContext, serviceProvider);
                await dbContext.SaveChangesAsync();
                logger.LogInformation($"Seeder {seeder.GetType().Name} done.");
            }
        }
    }
}
