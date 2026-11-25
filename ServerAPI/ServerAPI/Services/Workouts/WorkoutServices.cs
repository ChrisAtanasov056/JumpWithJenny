using Microsoft.EntityFrameworkCore;
using ServerAPI.Common;
using ServerAPI.Data.Common.Repositories;
using ServerAPI.Models;
using ServerAPI.Models.Common;
using ServerAPI.Models.Enums;
using ServerAPI.Models.Schedule;
using ServerAPI.ViewModels;
using ServerAPI.ViewModels.Workout;

namespace ServerAPI.Services.Workouts
{
    public class WorkoutServices : IWorkoutServices
    {
        private static readonly HashSet<string> AllowedStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "Available",
            "Booked",
            "Completed",
            "Cancelled"
        };

        private readonly IDeletableEntityRepository<Workout> _workoutRepository;
        private readonly IDeletableEntityRepository<Appointment> _appointmentRepository;
        private readonly IDeletableEntityRepository<Shoes> _shoesRepository;
        private readonly IDeletableEntityRepository<WorkoutShoes> _workoutShoesRepository;
        private readonly ILogger<WorkoutServices> _logger;

        public WorkoutServices(
            IDeletableEntityRepository<Workout> workoutRepository,
            IDeletableEntityRepository<Appointment> appointmentRepository,
            IDeletableEntityRepository<Shoes> shoesRepository,
            IDeletableEntityRepository<WorkoutShoes> workoutShoesRepository,
            ILogger<WorkoutServices> logger)
        {
            _workoutRepository = workoutRepository;
            _appointmentRepository = appointmentRepository;
            _shoesRepository = shoesRepository;
            _workoutShoesRepository = workoutShoesRepository;
            _logger = logger;
        }

        public async Task<WorkoutCreateModel> CreateWorkoutAsync(WorkoutCreateModel dto)
        {
            if (dto == null)
            {
                throw new ArgumentException("Workout payload is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.Day))
            {
                throw new ArgumentException("Workout day is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.Time))
            {
                throw new ArgumentException("Workout time is required.");
            }

            if (dto.Date == default)
            {
                throw new ArgumentException("Workout date is required.");
            }

            if (dto.AvailableSpots < 0)
            {
                throw new ArgumentException("Available spots cannot be negative.");
            }

            var status = string.IsNullOrWhiteSpace(dto.Status) ? "Available" : dto.Status.Trim();
            if (!AllowedStatuses.Contains(status))
            {
                throw new ArgumentException("Invalid workout status.");
            }

            if (dto.AvailableSpots == 0 && string.Equals(status, "Available", StringComparison.OrdinalIgnoreCase))
            {
                status = "Booked";
            }

            var normalizedDate = BulgariaTimeHelper.NormalizeToSofiaWallClock(dto.Date, dto.Time);

            var workout = new Workout
            {
                Day = dto.Day.Trim(),
                Time = dto.Time.Trim(),
                Date = normalizedDate,
                Status = status,
                AvailableSpots = dto.AvailableSpots
            };

            await _workoutRepository.AddAsync(workout);
            await _workoutRepository.SaveChangesAsync();

            var existingShoeIds = await _shoesRepository
                .AllAsNoTracking()
                .Select(shoe => shoe.Id)
                .ToListAsync();

            if (existingShoeIds.Count > 0)
            {
                var isBooked = string.Equals(workout.Status, "Booked", StringComparison.OrdinalIgnoreCase);
                var workoutShoes = existingShoeIds.Select(shoeId => new WorkoutShoes
                {
                    WorkoutId = workout.Id,
                    ShoeId = shoeId,
                    IsTaken = isBooked
                });

                await _workoutShoesRepository.AddRangeAsync(workoutShoes);
                await _workoutShoesRepository.SaveChangesAsync();
            }

            return new WorkoutCreateModel
            {
                Id = workout.Id,
                Day = workout.Day,
                Time = workout.Time,
                Date = BulgariaTimeHelper.SofiaToUtc(workout.Date),
                Status = workout.Status,
                AvailableSpots = workout.AvailableSpots,
            };
        }

        public async Task<AdminWorkoutViewModel> GetWorkoutByIdAsync(string id)
        {
            var workout = await _workoutRepository
                .AllAsNoTrackingSplitQuery()
                .Where(w => w.Id == id)
                .Select(w => new AdminWorkoutViewModel
                {
                    Id = w.Id,
                    Day = w.Day,
                    Time = w.Time,
                    Date = w.Date,
                    Status = w.Status,
                    AvailableSpots = w.AvailableSpots,
                    WorkoutShoes = w.WorkoutShoes
                        .Where(ws => !ws.IsDeleted && ws.Shoe != null && !ws.Shoe.IsDeleted)
                        .Select(ws => new WorkoutShoes
                        {
                            Id = ws.Id,
                            WorkoutId = ws.WorkoutId,
                            ShoeId = ws.ShoeId,
                            IsTaken = ws.IsTaken,
                            CreatedOn = ws.CreatedOn,
                            ModifiedOn = ws.ModifiedOn,
                            IsDeleted = ws.IsDeleted,
                            DeletedOn = ws.DeletedOn,
                            Shoe = new Shoes
                            {
                                Id = ws.Shoe.Id,
                                Size = ws.Shoe.Size,
                                CreatedOn = ws.Shoe.CreatedOn,
                                ModifiedOn = ws.Shoe.ModifiedOn,
                                IsDeleted = ws.Shoe.IsDeleted,
                                DeletedOn = ws.Shoe.DeletedOn,
                            }
                        })
                        .ToList(),
                    Appointments = w.Appointments
                        .Where(a => !a.IsDeleted)
                        .Select(a => new AppointmentViewModel
                        {
                            Id = a.Id,
                            UserId = a.UserId,
                            UserFullName = !string.IsNullOrWhiteSpace(a.FullName)
                                ? a.FullName
                                : (a.User != null ? (a.User.FirstName + " " + a.User.LastName).Trim() : "Guest"),
                            UserEmail = !string.IsNullOrWhiteSpace(a.Email)
                                ? a.Email
                                : (a.User != null ? a.User.Email : string.Empty),
                            ShoeId = a.ShoeId,
                            CardType = a.CardType ?? CardType.IndividualWorkout,
                            IsSubscriptionCard = a.CardType == CardType.CoolFit || a.CardType == CardType.PulseCard,
                            ShoeSize = a.Shoe != null ? a.Shoe.Size : (ShoesSize?)null,
                            UsesOwnShoes = a.UsesOwnShoes,
                        }).ToList()
                })
                .FirstOrDefaultAsync();

            if (workout == null)
            {
                throw new KeyNotFoundException($"Workout with ID {id} not found.");
            }

            workout.Date = BulgariaTimeHelper.SofiaToUtc(workout.Date);
            return workout;
        }

        public async Task DeleteWorkoutAsync(string id)
        {
            _logger.LogInformation("Service layer - Deleting workout {WorkoutId}", id);
            var workout = await _workoutRepository.All()
                .Include(w => w.WorkoutShoes)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (workout == null)
            {
                _logger.LogDebug("Workout lookup result for {WorkoutId}: Not Found", id);
                throw new KeyNotFoundException("Workout not found");
            }

            var appointments = await _appointmentRepository.All()
                .Where(a => a.WorkoutId == id)
                .ToListAsync();

            foreach (var appointment in appointments)
            {
                _appointmentRepository.Delete(appointment);
            }

            foreach (var workoutShoe in workout.WorkoutShoes)
            {
                _workoutShoesRepository.Delete(workoutShoe);
            }

            _workoutRepository.Delete(workout);
            await _workoutRepository.SaveChangesAsync();
        }

        public async Task<IEnumerable<GetParticipantsModel>> GetParticipantsAsync(string workoutId)
        {
            return await _appointmentRepository.AllAsNoTracking()
                .Where(a => a.WorkoutId == workoutId)
                .OrderBy(a => a.CreatedOn)
                .Select(a => new GetParticipantsModel
                {
                    Id = a.Id,
                    FullName = !string.IsNullOrWhiteSpace(a.FullName)
                        ? a.FullName
                        : (a.User != null ? (a.User.FirstName + " " + a.User.LastName).Trim() : "Guest"),
                    Email = !string.IsNullOrWhiteSpace(a.Email)
                        ? a.Email
                        : (a.User != null ? a.User.Email : string.Empty),
                    ShoeSize = a.Shoe != null ? a.Shoe.Size : (ShoesSize?)null,
                    UsesOwnShoes = a.UsesOwnShoes,
                    CardType = a.CardType ?? CardType.IndividualWorkout,
                    IsSubscriptionCard = a.CardType == CardType.CoolFit || a.CardType == CardType.PulseCard,
                })
                .ToListAsync();
        }

        public async Task<WorkoutUpdateModel> UpdateWorkoutAsync(string id, WorkoutUpdateModel dto)
        {
            if (dto == null)
            {
                throw new ArgumentException("Workout payload is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.Day))
            {
                throw new ArgumentException("Workout day is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.Time))
            {
                throw new ArgumentException("Workout time is required.");
            }

            if (dto.Date == default)
            {
                throw new ArgumentException("Workout date is required.");
            }

            if (dto.AvailableSpots < 0)
            {
                throw new ArgumentException("Available spots cannot be negative.");
            }

            var workout = await _workoutRepository.All()
                .Include(w => w.WorkoutShoes)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (workout == null)
            {
                throw new KeyNotFoundException("Workout not found");
            }

            var nextStatus = string.IsNullOrWhiteSpace(dto.Status) ? workout.Status : dto.Status.Trim();
            if (!AllowedStatuses.Contains(nextStatus))
            {
                throw new ArgumentException("Invalid workout status.");
            }

            if (dto.AvailableSpots == 0 && string.Equals(nextStatus, "Available", StringComparison.OrdinalIgnoreCase))
            {
                nextStatus = "Booked";
            }

            var normalizedDate = BulgariaTimeHelper.NormalizeToSofiaWallClock(dto.Date, dto.Time);

            workout.Day = dto.Day.Trim();
            workout.Time = dto.Time.Trim();
            workout.Date = normalizedDate;
            workout.Status = nextStatus;
            workout.AvailableSpots = dto.AvailableSpots;

            await _workoutRepository.SaveChangesAsync();

            return new WorkoutUpdateModel
            {
                Id = workout.Id,
                Day = workout.Day,
                Time = workout.Time,
                Date = BulgariaTimeHelper.SofiaToUtc(workout.Date),
                Status = workout.Status,
                AvailableSpots = workout.AvailableSpots
            };
        }

        public async Task<IEnumerable<AdminWorkoutViewModel>> GetAllWorkoutsAsync(CancellationToken cancellationToken = default)
        {
            var paged = await GetWorkoutsPagedAsync(page: 1, pageSize: 100, cancellationToken: cancellationToken);
            return paged.Items;
        }

        public async Task<PagedResult<AdminWorkoutViewModel>> GetWorkoutsPagedAsync(
            int page = 1,
            int pageSize = 20,
            bool? upcomingOnly = null,
            string search = null,
            CancellationToken cancellationToken = default)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _workoutRepository.AllAsNoTrackingSplitQuery();

            if (upcomingOnly.HasValue)
            {
                var nowSofia = BulgariaTimeHelper.GetCurrentSofiaTime();
                query = upcomingOnly.Value
                    ? query.Where(w => w.Date > nowSofia)
                    : query.Where(w => w.Date <= nowSofia);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(w =>
                    (w.Day != null && w.Day.ToLower().Contains(term)) ||
                    (w.Time != null && w.Time.ToLower().Contains(term)) ||
                    (w.Status != null && w.Status.ToLower().Contains(term)));
            }

            var totalCount = await query.CountAsync(cancellationToken);

            var orderedQuery = upcomingOnly == false
                ? query.OrderByDescending(w => w.Date)
                : query.OrderBy(w => w.Date);

            var workouts = await orderedQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(w => new AdminWorkoutViewModel
                {
                    Id = w.Id,
                    Day = w.Day,
                    Time = w.Time,
                    Date = w.Date,
                    Status = w.Status,
                    AvailableSpots = w.AvailableSpots,
                    WorkoutShoes = w.WorkoutShoes
                        .Where(ws => !ws.IsDeleted && ws.Shoe != null && !ws.Shoe.IsDeleted)
                        .Select(ws => new WorkoutShoes
                        {
                            Id = ws.Id,
                            WorkoutId = ws.WorkoutId,
                            ShoeId = ws.ShoeId,
                            IsTaken = ws.IsTaken,
                            CreatedOn = ws.CreatedOn,
                            ModifiedOn = ws.ModifiedOn,
                            IsDeleted = ws.IsDeleted,
                            DeletedOn = ws.DeletedOn,
                            Shoe = new Shoes
                            {
                                Id = ws.Shoe.Id,
                                Size = ws.Shoe.Size,
                                CreatedOn = ws.Shoe.CreatedOn,
                                ModifiedOn = ws.Shoe.ModifiedOn,
                                IsDeleted = ws.Shoe.IsDeleted,
                                DeletedOn = ws.Shoe.DeletedOn,
                            }
                        })
                        .ToList(),
                    Appointments = w.Appointments
                        .Where(a => !a.IsDeleted)
                        .Select(a => new AppointmentViewModel
                        {
                            Id = a.Id,
                            UserId = a.UserId,
                            UserFullName = !string.IsNullOrWhiteSpace(a.FullName)
                                ? a.FullName
                                : (a.User != null ? (a.User.FirstName + " " + a.User.LastName).Trim() : "Guest"),
                            UserEmail = !string.IsNullOrWhiteSpace(a.Email)
                                ? a.Email
                                : (a.User != null ? a.User.Email : string.Empty),
                            CardType = a.CardType ?? CardType.IndividualWorkout,
                            IsSubscriptionCard = a.CardType == CardType.CoolFit || a.CardType == CardType.PulseCard,
                            ShoeId = a.ShoeId,
                            ShoeSize = a.Shoe != null ? a.Shoe.Size : (ShoesSize?)null,
                            UsesOwnShoes = a.UsesOwnShoes
                        }).ToList()
                })
                .ToListAsync(cancellationToken);

            foreach (var workout in workouts)
            {
                workout.Date = BulgariaTimeHelper.SofiaToUtc(workout.Date);
            }

            return new PagedResult<AdminWorkoutViewModel>
            {
                Items = workouts,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
            };
        }
    }
}
