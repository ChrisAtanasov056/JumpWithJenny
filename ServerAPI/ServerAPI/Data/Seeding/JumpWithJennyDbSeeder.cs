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

            // Get the logger factory from the service provider
            var loggerFactory = serviceProvider.GetService<ILoggerFactory>();
            if (loggerFactory == null)
            {
                throw new InvalidOperationException("ILoggerFactory service is not registered.");
            }

            var logger = loggerFactory.CreateLogger(typeof(JumpWithJennyDbSeeder));

            // List of seeders to execute
            var seeders = new List<ISeeder>
            {
                new RolesSeeder(),
                new ShoesSeeder(),
                new WorkoutSeeder(),
                new AccountSeeder(),
                new ImageSeeder()
            }; 

            // Execute each seeder
            foreach (var seeder in seeders)
            {
                try
                {
                    logger.LogInformation($"Starting seeder: {seeder.GetType().Name}");
                    await seeder.SeedAsync(dbContext, serviceProvider);
                    logger.LogInformation($"Completed seeder: {seeder.GetType().Name}");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, $"Error in seeder {seeder.GetType().Name}: {ex.Message}");
                    throw; // Re-throw the exception to stop the seeding process
                }
            }

            // Save changes to the database once after all seeders have run
            await dbContext.SaveChangesAsync();
            logger.LogInformation("All seeders completed successfully.");
        }
    }
}