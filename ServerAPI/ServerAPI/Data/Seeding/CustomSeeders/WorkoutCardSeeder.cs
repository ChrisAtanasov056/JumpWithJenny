using Microsoft.Extensions.Logging;
using ServerAPI.Models;
using ServerAPI.Models.Enums;

namespace ServerAPI.Data.Seeding.CustomSeeders
{
    public class WorkoutCardTypesSeeder : ISeeder
    {
        public async Task SeedAsync(JumpWithJennyDbContext dbContext, IServiceProvider serviceProvider)
        {
            if (dbContext.WorkoutCardTypes.Any())
            {
                return; // Exit if already seeded
            }

            var logger = serviceProvider.GetRequiredService<ILogger<WorkoutCardTypesSeeder>>();

            // Create WorkoutCardType entries based on the CardType enum
            var cardTypes = Enum.GetValues(typeof(CardType))
                .Cast<CardType>()
                .Select(ct => new WorkoutCardType 
                { 
                    CardType = ct // Directly assign the enum without converting to string
                })
                .ToList();

            // Add the card types to the database and save changes
            await dbContext.WorkoutCardTypes.AddRangeAsync(cardTypes);
            await dbContext.SaveChangesAsync();

            // Log the number of seeded workout card types
            logger.LogInformation("Seeded {Count} WorkoutCardTypes.", cardTypes.Count); // Log message only
        }
    }
}