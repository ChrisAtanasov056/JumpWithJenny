using Microsoft.EntityFrameworkCore;
using ServerAPI.Data;
using ServerAPI.DTOs;
using ServerAPI.Models;
using ServerAPI.Models.Enums;

namespace ServerAPI.Services
{
    public class ShoesService : IShoesService
    {
        private static readonly TimeZoneInfo BulgariaTimeZone =
            TimeZoneInfo.FindSystemTimeZoneById("Europe/Sofia");

        private readonly JumpWithJennyDbContext _context;

        public ShoesService(JumpWithJennyDbContext context)
        {
            _context = context;
        }

        private static DateTime GetCurrentLocalTime() =>
            TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, BulgariaTimeZone);

        public async Task<List<ShoesDTO>> GetAllShoesAsync()
        {
            var shoes = await _context.Shoes
                .AsNoTracking()
                .ToListAsync();

            return shoes.Select(s => new ShoesDTO
            {
                Id = s.Id,
                Size = s.Size
            }).ToList();
        }

        public async Task<ShoesDetailsDTO> GetShoeDetailsAsync(string id)
        {
            var shoe = await _context.Shoes
                .AsNoTracking()
                .Include(s => s.Workouts)
                    .ThenInclude(ws => ws.Workout)
                .Include(s => s.UsersHistory)
                    .ThenInclude(uh => uh.User)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (shoe == null)
            {
                return null;
            }

            return new ShoesDetailsDTO
            {
                Id = shoe.Id,
                Size = shoe.Size,
                Workouts = shoe.Workouts
                    .Where(ws => !ws.IsDeleted && ws.Workout != null && !ws.Workout.IsDeleted)
                    .Select(ws => new WorkoutDTO
                    {
                        Id = ws.Workout.Id,
                        Date = ws.Workout.Date,
                        Day = ws.Workout.Day,
                        Time = ws.Workout.Time,
                    }).ToList(),
                Users = shoe.UsersHistory
                    .Where(uh => uh.User != null)
                    .Select(uh => new UserDTO
                    {
                        Id = uh.User.Id,
                        Username = uh.User.UserName,
                    }).ToList()
            };
        }

        public async Task<Shoes> AddShoeAsync(ShoesDTO newShoeDto)
        {
            if (newShoeDto == null || !Enum.IsDefined(typeof(ShoesSize), newShoeDto.Size))
            {
                throw new ArgumentException("Invalid shoe size.");
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();

            var newShoe = new Shoes
            {
                Size = newShoeDto.Size
            };

            _context.Shoes.Add(newShoe);
            await _context.SaveChangesAsync();

            var nowLocal = GetCurrentLocalTime();
            var upcomingWorkouts = await _context.Workouts
                .Where(w => w.Date > nowLocal)
                .ToListAsync();

            if (upcomingWorkouts.Count > 0)
            {
                var workoutShoes = upcomingWorkouts.Select(workout => new WorkoutShoes
                {
                    WorkoutId = workout.Id,
                    ShoeId = newShoe.Id,
                    IsTaken = false
                });

                await _context.WorkoutShoes.AddRangeAsync(workoutShoes);
                await _context.SaveChangesAsync();
            }

            await transaction.CommitAsync();
            return newShoe;
        }

        public async Task<bool> UpdateShoeAsync(string id, ShoesDTO updatedShoeDto)
        {
            if (updatedShoeDto == null || !Enum.IsDefined(typeof(ShoesSize), updatedShoeDto.Size))
            {
                throw new ArgumentException("Invalid shoe size.");
            }

            var shoeToUpdate = await _context.Shoes.FirstOrDefaultAsync(s => s.Id == id);
            if (shoeToUpdate == null)
            {
                return false;
            }

            if (shoeToUpdate.Size != updatedShoeDto.Size)
            {
                var nowLocal = GetCurrentLocalTime();
                var isReserved = await _context.WorkoutShoes
                    .AnyAsync(ws => ws.ShoeId == id && ws.IsTaken && ws.Workout.Date > nowLocal);

                if (isReserved)
                {
                    throw new InvalidOperationException("Cannot change the size of a shoe that is currently reserved for an upcoming workout.");
                }
            }

            shoeToUpdate.Size = updatedShoeDto.Size;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteShoeAsync(string id)
        {
            var shoeToDelete = await _context.Shoes.FirstOrDefaultAsync(s => s.Id == id);
            if (shoeToDelete == null)
            {
                return false;
            }

            var nowLocal = GetCurrentLocalTime();
            var isReservedInWorkoutShoes = await _context.WorkoutShoes
                .AnyAsync(ws => ws.ShoeId == id && ws.IsTaken && ws.Workout.Date > nowLocal);

            var isReservedInAppointments = await _context.Appointments
                .AnyAsync(a => a.ShoeId == id && a.Workout.Date > nowLocal);

            if (isReservedInWorkoutShoes || isReservedInAppointments)
            {
                throw new InvalidOperationException("Cannot delete a shoe that is currently reserved for an upcoming workout.");
            }

            var nowUtc = DateTime.UtcNow;
            var workoutShoes = await _context.WorkoutShoes
                .Where(ws => ws.ShoeId == id)
                .ToListAsync();

            foreach (var ws in workoutShoes)
            {
                ws.IsDeleted = true;
                ws.DeletedOn = nowUtc;
            }

            shoeToDelete.IsDeleted = true;
            shoeToDelete.DeletedOn = nowUtc;

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
