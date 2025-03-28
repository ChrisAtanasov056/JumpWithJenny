using Microsoft.Extensions.Logging;
using ServerAPI.Data;
using ServerAPI.Data.Seeding;
using ServerAPI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class WorkoutSeeder : ISeeder
{
    public async Task SeedAsync(JumpWithJennyDbContext dbContext, IServiceProvider serviceProvider)
    {
        if (dbContext.Workouts.Any())
        {
            return; // Exit if workouts already exist
        }

        var logger = serviceProvider.GetRequiredService<ILogger<WorkoutSeeder>>();

        var shoes = dbContext.Shoes.ToList();  // Get all shoes from the database
        var cardTypes = dbContext.WorkoutCardTypes.ToList(); // Get all workout card types

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
            var workout = new Workout
            {
                Day = day,
                Time = time,
                Status = status,
                WorkoutCardTypes = cardTypes, // Assign all card types (if many-to-many)
                AvailableSpots = 20 // Max 20 people (users with or without shoes)
            };

            workouts.Add(workout);
        }

        await dbContext.Workouts.AddRangeAsync(workouts);
        await dbContext.SaveChangesAsync();

        // Fetch the saved workouts
        var savedWorkouts = dbContext.Workouts.ToList();

        var workoutShoes = new List<WorkoutShoes>();

        foreach (var workout in savedWorkouts)
        {
            foreach (var shoe in shoes)
            {
                workoutShoes.Add(new WorkoutShoes
                {
                    WorkoutId = workout.Id,  // Set the foreign key for Workout
                    ShoeId = shoe.Id,        // Set the foreign key for Shoe
                    IsTaken = workout.Status == "Booked" // Set the IsTaken flag
                });
            }
        }

        await dbContext.WorkoutShoes.AddRangeAsync(workoutShoes);
        await dbContext.SaveChangesAsync();

        logger.LogInformation("Seeded {Count} workouts and {ShoeCount} workout-shoe relationships.", workouts.Count, workoutShoes.Count);
    }
}