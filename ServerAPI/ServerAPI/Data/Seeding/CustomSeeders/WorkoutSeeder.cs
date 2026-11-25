using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using ServerAPI.Common;
using ServerAPI.Data;
using ServerAPI.Data.Seeding;
using ServerAPI.Models;

public class WorkoutSeeder : ISeeder
{
    public async Task SeedAsync(JumpWithJennyDbContext dbContext, IServiceProvider serviceProvider)
    {
        var logger = serviceProvider.GetRequiredService<ILogger<WorkoutSeeder>>();
        var environment = serviceProvider.GetRequiredService<IHostEnvironment>();
        var nowSofia = BulgariaTimeHelper.GetCurrentSofiaTime();

        // Repair any legacy workouts that were seeded before the Date column was populated.
        var uninitializedWorkouts = await dbContext.Workouts
            .Where(w => w.Date.Year <= 1900)
            .ToListAsync();

        if (uninitializedWorkouts.Count > 0)
        {
            foreach (var legacyWorkout in uninitializedWorkouts)
            {
                if (Enum.TryParse<DayOfWeek>(legacyWorkout.Day, ignoreCase: true, out var parsedDay) &&
                    TimeSpan.TryParse(legacyWorkout.Time, out var parsedTime))
                {
                    legacyWorkout.Date = BulgariaTimeHelper.GetNextUpcomingSofiaDate(parsedDay, parsedTime, nowSofia);
                }
            }

            await dbContext.SaveChangesAsync();
            logger.LogInformation("Updated legacy Date values for {Count} existing workouts.", uninitializedWorkouts.Count);
        }

        var hasAnyWorkouts = await dbContext.Workouts.AnyAsync();
        var hasUpcomingWorkouts = await dbContext.Workouts.AnyAsync(w => w.Date > nowSofia);

        if (hasAnyWorkouts && (!environment.IsDevelopment() || hasUpcomingWorkouts))
        {
            return;
        }

        var shoes = await dbContext.Shoes.ToListAsync();
        var cardTypes = await dbContext.WorkoutCardTypes.ToListAsync();

        var specificWorkouts = new List<(string Day, string Time, string Status)>
        {
            ("Monday", "18:00", "Available"),
            ("Wednesday", "18:00", "Available"),
            ("Friday", "18:00", "Available"),
            ("Saturday", "14:00", "Booked"),
            ("Sunday", "15:00", "Available")
        };

        var workouts = new List<Workout>();

        foreach (var (day, time, status) in specificWorkouts)
        {
            var dayOfWeek = Enum.Parse<DayOfWeek>(day, ignoreCase: true);
            var timeOfDay = TimeSpan.Parse(time);

            var workout = new Workout
            {
                Day = day,
                Time = time,
                Date = BulgariaTimeHelper.GetNextUpcomingSofiaDate(dayOfWeek, timeOfDay, nowSofia),
                Status = status,
                WorkoutCardTypes = cardTypes,
                AvailableSpots = string.Equals(status, "Booked", StringComparison.OrdinalIgnoreCase) ? 0 : 20
            };

            workouts.Add(workout);
        }

        await dbContext.Workouts.AddRangeAsync(workouts);
        await dbContext.SaveChangesAsync();

        var workoutShoes = new List<WorkoutShoes>();

        foreach (var workout in workouts)
        {
            foreach (var shoe in shoes)
            {
                workoutShoes.Add(new WorkoutShoes
                {
                    WorkoutId = workout.Id,
                    ShoeId = shoe.Id,
                    IsTaken = string.Equals(workout.Status, "Booked", StringComparison.OrdinalIgnoreCase)
                });
            }
        }

        if (workoutShoes.Count > 0)
        {
            await dbContext.WorkoutShoes.AddRangeAsync(workoutShoes);
            await dbContext.SaveChangesAsync();
        }

        logger.LogInformation("Seeded {Count} workouts and {ShoeCount} workout-shoe relationships.", workouts.Count, workoutShoes.Count);
    }
}
