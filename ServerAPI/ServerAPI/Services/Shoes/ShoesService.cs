using Microsoft.EntityFrameworkCore;
using ServerAPI.Common;
using ServerAPI.Data;
using ServerAPI.DTOs;
using ServerAPI.Models;
using ServerAPI.Models.Admin;
using ServerAPI.Models.Enums;

namespace ServerAPI.Services
{
    public class ShoesService : IShoesService
    {
        private readonly JumpWithJennyDbContext _context;

        public ShoesService(JumpWithJennyDbContext context)
        {
            _context = context;
        }

        public async Task<List<ShoesDTO>> GetAllShoesAsync()
        {
            return await _context.Shoes
                .AsNoTracking()
                .OrderBy(s => s.Size)
                .Select(s => new ShoesDTO
                {
                    Id = s.Id,
                    Size = s.Size
                })
                .ToListAsync();
        }

        public async Task<ShoesInventoryDto> GetShoesInventoryAsync()
        {
            var nowSofia = BulgariaTimeHelper.GetCurrentSofiaTime();

            var shoes = await _context.Shoes
                .AsNoTracking()
                .OrderBy(s => s.Size)
                .ThenBy(s => s.CreatedOn)
                .Select(s => new
                {
                    s.Id,
                    s.Size,
                    s.CreatedOn,
                    UpcomingWorkoutDates = s.Workouts
                        .Where(ws => !ws.IsDeleted && ws.IsTaken && ws.Workout != null && !ws.Workout.IsDeleted && ws.Workout.Date > nowSofia && ws.Workout.Status != "Cancelled")
                        .Select(ws => ws.Workout.Date)
                        .ToList(),
                })
                .ToListAsync();

            var items = shoes.Select(s =>
            {
                DateTime? nextReservedUtc = s.UpcomingWorkoutDates.Count > 0
                    ? BulgariaTimeHelper.SofiaToUtc(s.UpcomingWorkoutDates.Min())
                    : null;

                return new ShoeInventoryItemDto
                {
                    Id = s.Id,
                    Size = s.Size,
                    CreatedOn = DateTime.SpecifyKind(s.CreatedOn, DateTimeKind.Utc),
                    IsReservedUpcoming = s.UpcomingWorkoutDates.Count > 0,
                    UpcomingReservationsCount = s.UpcomingWorkoutDates.Count,
                    NextReservedWorkoutDate = nextReservedUtc,
                };
            }).ToList();

            var summaries = Enum.GetValues<ShoesSize>()
                .Select(size =>
                {
                    var forSize = items.Where(i => i.Size == size).ToList();
                    var reservedCount = forSize.Count(i => i.IsReservedUpcoming);
                    return new ShoeSizeSummaryDto
                    {
                        Size = size,
                        TotalCount = forSize.Count,
                        ReservedUpcomingCount = reservedCount,
                        FreeToDeleteCount = forSize.Count - reservedCount,
                    };
                })
                .ToList();

            return new ShoesInventoryDto
            {
                TotalCount = items.Count,
                ReservedUpcomingCount = items.Count(i => i.IsReservedUpcoming),
                SizeSummaries = summaries,
                Items = items,
            };
        }

        public async Task<List<ShoesDTO>> AddShoesBatchAsync(ShoesSize size, int count)
        {
            if (!Enum.IsDefined(typeof(ShoesSize), size))
            {
                throw new ArgumentException("Invalid shoe size.");
            }

            if (count < 1 || count > 20)
            {
                throw new ArgumentException("Count must be between 1 and 20.");
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();

            var newShoes = Enumerable.Range(0, count)
                .Select(_ => new Shoes { Size = size })
                .ToList();

            await _context.Shoes.AddRangeAsync(newShoes);
            await _context.SaveChangesAsync();

            var nowLocal = BulgariaTimeHelper.GetCurrentSofiaTime();
            var upcomingWorkoutIds = await _context.Workouts
                .AsNoTracking()
                .Where(w => w.Date > nowLocal)
                .Select(w => w.Id)
                .ToListAsync();

            if (upcomingWorkoutIds.Count > 0)
            {
                var workoutShoes = new List<WorkoutShoes>(upcomingWorkoutIds.Count * newShoes.Count);
                foreach (var shoe in newShoes)
                {
                    foreach (var workoutId in upcomingWorkoutIds)
                    {
                        workoutShoes.Add(new WorkoutShoes
                        {
                            WorkoutId = workoutId,
                            ShoeId = shoe.Id,
                            IsTaken = false,
                        });
                    }
                }

                await _context.WorkoutShoes.AddRangeAsync(workoutShoes);
                await _context.SaveChangesAsync();
            }

            await transaction.CommitAsync();

            return newShoes.Select(s => new ShoesDTO { Id = s.Id, Size = s.Size }).ToList();
        }

        public async Task<bool> DeleteOneFreeShoeBySizeAsync(ShoesSize size)
        {
            if (!Enum.IsDefined(typeof(ShoesSize), size))
            {
                throw new ArgumentException("Invalid shoe size.");
            }

            var nowLocal = BulgariaTimeHelper.GetCurrentSofiaTime();

            var candidates = await _context.Shoes
                .Where(s => s.Size == size)
                .OrderByDescending(s => s.CreatedOn)
                .Select(s => new
                {
                    Shoe = s,
                    HasUpcomingReservation =
                        _context.WorkoutShoes.Any(ws => ws.ShoeId == s.Id && ws.IsTaken && ws.Workout.Date > nowLocal) ||
                        _context.Appointments.Any(a => a.ShoeId == s.Id && a.Workout.Date > nowLocal)
                })
                .ToListAsync();

            if (candidates.Count == 0)
            {
                return false;
            }

            var freeCandidate = candidates.FirstOrDefault(c => !c.HasUpcomingReservation);
            if (freeCandidate == null)
            {
                throw new InvalidOperationException("All pairs of this size are currently reserved in upcoming workouts.");
            }

            return await DeleteShoeAsync(freeCandidate.Shoe.Id);
        }

        public async Task<ShoesDetailsDTO> GetShoeDetailsAsync(string id)
        {
            var shoeDetails = await _context.Shoes
                .AsNoTracking()
                .AsSplitQuery()
                .Where(s => s.Id == id)
                .Select(s => new ShoesDetailsDTO
                {
                    Id = s.Id,
                    Size = s.Size,
                    Workouts = s.Workouts
                        .Where(ws => !ws.IsDeleted && ws.Workout != null && !ws.Workout.IsDeleted)
                        .Select(ws => new WorkoutDTO
                        {
                            Id = ws.Workout.Id,
                            Date = ws.Workout.Date,
                            Day = ws.Workout.Day,
                            Time = ws.Workout.Time,
                        }).ToList(),
                    Users = s.UsersHistory
                        .Where(uh => uh.User != null)
                        .Select(uh => new UserDTO
                        {
                            Id = uh.User.Id,
                            Username = uh.User.UserName,
                        }).ToList()
                })
                .FirstOrDefaultAsync();

            if (shoeDetails == null)
            {
                return null;
            }

            foreach (var workout in shoeDetails.Workouts)
            {
                workout.Date = BulgariaTimeHelper.SofiaToUtc(workout.Date);
            }

            return shoeDetails;
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

            var nowLocal = BulgariaTimeHelper.GetCurrentSofiaTime();
            var upcomingWorkoutIds = await _context.Workouts
                .AsNoTracking()
                .Where(w => w.Date > nowLocal)
                .Select(w => w.Id)
                .ToListAsync();

            if (upcomingWorkoutIds.Count > 0)
            {
                var workoutShoes = upcomingWorkoutIds.Select(workoutId => new WorkoutShoes
                {
                    WorkoutId = workoutId,
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
                var nowLocal = BulgariaTimeHelper.GetCurrentSofiaTime();
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

            var nowLocal = BulgariaTimeHelper.GetCurrentSofiaTime();
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
