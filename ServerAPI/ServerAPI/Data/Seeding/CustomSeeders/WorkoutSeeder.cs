using ServerAPI.Models;

namespace ServerAPI.Data.Seeding.CustomSeeders
{
    public class WorkoutSeeder : ISeeder

    {

        public async Task SeedAsync(JumpWithJennyDbContext dbContext, IServiceProvider serviceProvider)
        {
            var datetime = new DateTime(2022, 7, 18, 18, 00, 00);
            var endDate = datetime.AddMonths(6);
            var shoes = dbContext.Shoes.Select(x=>x).ToList();
            if (dbContext.Workouts.Any())
            {
                return;
            }
            var workouts = new List<Workout>();
            
            while (true)
            {
                if (datetime == endDate)
                {
                    break;
                }
                if (datetime.DayOfWeek == DayOfWeek.Monday || datetime.DayOfWeek == DayOfWeek.Tuesday)
                {
                    var workout = new Workout
                    {
                        WorkoutStart = datetime,
                        WorkoutEnd = datetime.AddHours(1),
                        Shoes = shoes,
                        AvailableSpots = shoes.Count
                    };
                    workouts.Add(workout);
                }
                if (datetime.DayOfWeek == DayOfWeek.Saturday)
                {
                    var workout = new Workout
                    {
                        WorkoutStart = datetime,
                        WorkoutEnd = datetime.AddHours(1),
                        Shoes = shoes,
                        AvailableSpots = shoes.Count
                    };
                    workout.WorkoutStart.AddHours(-2);
                    workouts.Add(workout);
                }
               datetime = datetime.AddDays(+1);

            }
            foreach (var workout in workouts)
            {
                await dbContext.AddAsync(workout);
                await dbContext.SaveChangesAsync();
            }
        }
    }
}
