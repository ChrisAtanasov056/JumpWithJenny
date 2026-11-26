using Microsoft.EntityFrameworkCore;
using ServerAPI.Common;
using ServerAPI.Data;
using ServerAPI.Data.Common.Repositories;
using ServerAPI.Models;
using ServerAPI.Models.Admin;
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

        private static readonly (string BgPrefix, string EnDay)[] BulgarianDayMappings =
        {
            ("пон", "monday"),
            ("вто", "tuesday"),
            ("сря", "wednesday"),
            ("чет", "thursday"),
            ("пет", "friday"),
            ("съб", "saturday"),
            ("нед", "sunday"),
        };

        private readonly JumpWithJennyDbContext _context;
        private readonly IDeletableEntityRepository<Workout> _workoutRepository;
        private readonly IDeletableEntityRepository<Appointment> _appointmentRepository;
        private readonly IDeletableEntityRepository<Shoes> _shoesRepository;
        private readonly IDeletableEntityRepository<WorkoutShoes> _workoutShoesRepository;
        private readonly ILogger<WorkoutServices> _logger;

        public WorkoutServices(
            JumpWithJennyDbContext context,
            IDeletableEntityRepository<Workout> workoutRepository,
            IDeletableEntityRepository<Appointment> appointmentRepository,
            IDeletableEntityRepository<Shoes> shoesRepository,
            IDeletableEntityRepository<WorkoutShoes> workoutShoesRepository,
            ILogger<WorkoutServices> logger)
        {
            _context = context;
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
            var derivedDay = normalizedDate.DayOfWeek.ToString();
            var derivedTime = TimeSpan.TryParse(dto.Time.Trim(), out _)
                ? normalizedDate.ToString("HH:mm")
                : dto.Time.Trim();

            var workout = new Workout
            {
                Day = derivedDay,
                Time = derivedTime,
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
                        .OrderBy(a => a.CreatedOn)
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
                            PhoneNumber = !string.IsNullOrWhiteSpace(a.PhoneNumber)
                                ? a.PhoneNumber
                                : (a.User != null ? a.User.PhoneNumber ?? string.Empty : string.Empty),
                            ShoeId = a.ShoeId,
                            ShoeSize = a.Shoe != null ? a.Shoe.Size : (ShoesSize?)null,
                            UsesOwnShoes = a.UsesOwnShoes,
                            IsAttended = a.IsAttended,
                            AttendedAt = a.AttendedAt,
                            CreatedOn = a.CreatedOn,
                        }).ToList()
                })
                .FirstOrDefaultAsync();

            if (workout == null)
            {
                throw new KeyNotFoundException($"Workout with ID {id} not found.");
            }

            EnrichAdminWorkout(workout);
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
            var participants = await _appointmentRepository.AllAsNoTracking()
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
                    PhoneNumber = !string.IsNullOrWhiteSpace(a.PhoneNumber)
                        ? a.PhoneNumber
                        : (a.User != null ? a.User.PhoneNumber ?? string.Empty : string.Empty),
                    ShoeSize = a.Shoe != null ? a.Shoe.Size : (ShoesSize?)null,
                    UsesOwnShoes = a.UsesOwnShoes,
                    IsAttended = a.IsAttended,
                    AttendedAt = a.AttendedAt,
                    CreatedOn = a.CreatedOn,
                })
                .ToListAsync();

            foreach (var participant in participants)
            {
                participant.CreatedOn = DateTime.SpecifyKind(participant.CreatedOn, DateTimeKind.Utc);
                if (participant.AttendedAt.HasValue)
                {
                    participant.AttendedAt = DateTime.SpecifyKind(participant.AttendedAt.Value, DateTimeKind.Utc);
                }
            }

            return participants;
        }

        public async Task<WorkoutUpdateModel> UpdateWorkoutAsync(string id, WorkoutUpdateModel dto)
        {
            if (dto == null)
            {
                throw new ArgumentException("Workout payload is required.");
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
            var derivedDay = normalizedDate.DayOfWeek.ToString();
            var derivedTime = TimeSpan.TryParse(dto.Time.Trim(), out _)
                ? normalizedDate.ToString("HH:mm")
                : dto.Time.Trim();

            workout.Day = derivedDay;
            workout.Time = derivedTime;
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
            string status = null,
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

            if (!string.IsNullOrWhiteSpace(status))
            {
                var normalizedStatus = status.Trim().ToLower();
                query = query.Where(w => w.Status != null && w.Status.ToLower() == normalizedStatus);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                var mappedDay = MapBulgarianDayTerm(term);

                query = query.Where(w =>
                    (w.Day != null && w.Day.ToLower().Contains(term)) ||
                    (mappedDay != null && w.Day != null && w.Day.ToLower().Contains(mappedDay)) ||
                    (w.Time != null && w.Time.ToLower().Contains(term)) ||
                    (w.Status != null && w.Status.ToLower().Contains(term)) ||
                    w.Appointments.Any(a =>
                        !a.IsDeleted &&
                        ((a.FullName != null && a.FullName.ToLower().Contains(term)) ||
                         (a.Email != null && a.Email.ToLower().Contains(term)) ||
                         (a.PhoneNumber != null && a.PhoneNumber.ToLower().Contains(term)))));
            }

            var totalCount = await query.CountAsync(cancellationToken);

            var orderedQuery = upcomingOnly == true
                ? query.OrderBy(w => w.Date)
                : query.OrderByDescending(w => w.Date);

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
                        .OrderBy(a => a.CreatedOn)
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
                            PhoneNumber = !string.IsNullOrWhiteSpace(a.PhoneNumber)
                                ? a.PhoneNumber
                                : (a.User != null ? a.User.PhoneNumber ?? string.Empty : string.Empty),
                            ShoeId = a.ShoeId,
                            ShoeSize = a.Shoe != null ? a.Shoe.Size : (ShoesSize?)null,
                            UsesOwnShoes = a.UsesOwnShoes,
                            IsAttended = a.IsAttended,
                            AttendedAt = a.AttendedAt,
                            CreatedOn = a.CreatedOn,
                        }).ToList()
                })
                .ToListAsync(cancellationToken);

            foreach (var workout in workouts)
            {
                EnrichAdminWorkout(workout);
            }

            return new PagedResult<AdminWorkoutViewModel>
            {
                Items = workouts,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
            };
        }

        public async Task<AdminWorkoutViewModel> DuplicateWorkoutAsync(string id, DuplicateWorkoutRequest request)
        {
            var source = await _workoutRepository
                .AllAsNoTracking()
                .Where(w => w.Id == id)
                .Select(w => new
                {
                    w.Id,
                    w.Time,
                    w.Date,
                    w.AvailableSpots,
                    ActiveAppointments = w.Appointments.Count(a => !a.IsDeleted)
                })
                .FirstOrDefaultAsync();

            if (source == null)
            {
                throw new KeyNotFoundException($"Workout with ID {id} not found.");
            }

            var daysOffset = request?.DaysOffset > 0 ? request.DaysOffset : 7;
            var targetDate = request?.TargetDate.HasValue == true
                ? BulgariaTimeHelper.NormalizeToSofiaWallClock(request.TargetDate.Value, source.Time)
                : BulgariaTimeHelper.NormalizeToSofiaWallClock(source.Date.AddDays(daysOffset), source.Time);

            var capacity = request?.AvailableSpots.HasValue == true && request.AvailableSpots.Value > 0
                ? request.AvailableSpots.Value
                : Math.Max(source.AvailableSpots + source.ActiveAppointments, 1);

            var existingDuplicate = await _workoutRepository
                .AllAsNoTracking()
                .AnyAsync(w => w.Date == targetDate);

            if (existingDuplicate)
            {
                throw new InvalidOperationException("A workout is already scheduled at that date and time.");
            }

            var workout = new Workout
            {
                Day = targetDate.DayOfWeek.ToString(),
                Time = targetDate.ToString("HH:mm"),
                Date = targetDate,
                Status = "Available",
                AvailableSpots = capacity,
            };

            await using var transaction = await _context.Database.BeginTransactionAsync();

            await _workoutRepository.AddAsync(workout);
            await _workoutRepository.SaveChangesAsync();

            var shoeIds = await _shoesRepository
                .AllAsNoTracking()
                .Select(s => s.Id)
                .ToListAsync();

            if (shoeIds.Count > 0)
            {
                var workoutShoes = shoeIds.Select(shoeId => new WorkoutShoes
                {
                    WorkoutId = workout.Id,
                    ShoeId = shoeId,
                    IsTaken = false,
                });

                await _workoutShoesRepository.AddRangeAsync(workoutShoes);
                await _workoutShoesRepository.SaveChangesAsync();
            }

            await transaction.CommitAsync();
            return await GetWorkoutByIdAsync(workout.Id);
        }

        public async Task<BatchCreateWorkoutsResult> CreateWorkoutsBatchAsync(BatchCreateWorkoutsRequest request)
        {
            if (request?.Slots == null || request.Slots.Count == 0)
            {
                throw new ArgumentException("At least one workout slot is required.");
            }

            if (request.Slots.Count > 30)
            {
                throw new ArgumentException("Cannot create more than 30 workouts in a single batch.");
            }

            var normalizedSlots = new List<(DateTime Date, string Time, int Spots)>();
            var seenDates = new HashSet<DateTime>();
            var skippedCount = 0;

            foreach (var slot in request.Slots)
            {
                if (slot == null || slot.Date == default || string.IsNullOrWhiteSpace(slot.Time))
                {
                    throw new ArgumentException("Each slot requires a valid date and time.");
                }

                if (slot.AvailableSpots < 1 || slot.AvailableSpots > 100)
                {
                    throw new ArgumentException("Available spots for each slot must be between 1 and 100.");
                }

                var normalizedDate = BulgariaTimeHelper.NormalizeToSofiaWallClock(slot.Date, slot.Time);
                if (!seenDates.Add(normalizedDate))
                {
                    skippedCount++;
                    continue;
                }

                var timeStr = TimeSpan.TryParse(slot.Time.Trim(), out _)
                    ? normalizedDate.ToString("HH:mm")
                    : slot.Time.Trim();

                normalizedSlots.Add((normalizedDate, timeStr, slot.AvailableSpots));
            }

            var targetDates = normalizedSlots.Select(s => s.Date).ToList();
            var existingDates = await _workoutRepository
                .AllAsNoTracking()
                .Where(w => targetDates.Contains(w.Date))
                .Select(w => w.Date)
                .ToListAsync();

            var existingSet = new HashSet<DateTime>(existingDates);
            var slotsToCreate = new List<(DateTime Date, string Time, int Spots)>();

            foreach (var slot in normalizedSlots)
            {
                if (existingSet.Contains(slot.Date))
                {
                    skippedCount++;
                    continue;
                }

                slotsToCreate.Add(slot);
            }

            var createdIds = new List<string>();

            if (slotsToCreate.Count > 0)
            {
                var shoeIds = await _shoesRepository
                    .AllAsNoTracking()
                    .Select(s => s.Id)
                    .ToListAsync();

                await using var transaction = await _context.Database.BeginTransactionAsync();

                var newWorkouts = new List<Workout>();
                var newWorkoutShoes = new List<WorkoutShoes>();

                foreach (var slot in slotsToCreate)
                {
                    var workout = new Workout
                    {
                        Day = slot.Date.DayOfWeek.ToString(),
                        Time = slot.Time,
                        Date = slot.Date,
                        Status = "Available",
                        AvailableSpots = slot.Spots,
                    };

                    newWorkouts.Add(workout);
                    createdIds.Add(workout.Id);

                    foreach (var shoeId in shoeIds)
                    {
                        newWorkoutShoes.Add(new WorkoutShoes
                        {
                            WorkoutId = workout.Id,
                            ShoeId = shoeId,
                            IsTaken = false,
                        });
                    }
                }

                await _workoutRepository.AddRangeAsync(newWorkouts);
                await _workoutRepository.SaveChangesAsync();

                if (newWorkoutShoes.Count > 0)
                {
                    await _workoutShoesRepository.AddRangeAsync(newWorkoutShoes);
                    await _workoutShoesRepository.SaveChangesAsync();
                }

                await transaction.CommitAsync();
            }

            var createdWorkouts = new List<AdminWorkoutViewModel>(createdIds.Count);
            foreach (var createdId in createdIds)
            {
                createdWorkouts.Add(await GetWorkoutByIdAsync(createdId));
            }

            return new BatchCreateWorkoutsResult
            {
                CreatedCount = createdWorkouts.Count,
                SkippedCount = skippedCount,
                Workouts = createdWorkouts.OrderBy(w => w.Date).ToList(),
            };
        }

        private static void EnrichAdminWorkout(AdminWorkoutViewModel workout)
        {
            workout.Date = BulgariaTimeHelper.SofiaToUtc(workout.Date);
            var appointments = workout.Appointments ?? new List<AppointmentViewModel>();
            workout.TakenSpots = appointments.Count;
            workout.TotalSpots = workout.AvailableSpots + workout.TakenSpots;
            workout.AttendedCount = appointments.Count(a => a.IsAttended);

            foreach (var appointment in appointments)
            {
                appointment.CreatedOn = DateTime.SpecifyKind(appointment.CreatedOn, DateTimeKind.Utc);
                if (appointment.AttendedAt.HasValue)
                {
                    appointment.AttendedAt = DateTime.SpecifyKind(appointment.AttendedAt.Value, DateTimeKind.Utc);
                }
            }
        }

        private static string MapBulgarianDayTerm(string lowerTerm)
        {
            foreach (var (bgPrefix, enDay) in BulgarianDayMappings)
            {
                if (lowerTerm.StartsWith(bgPrefix, StringComparison.Ordinal))
                {
                    return enDay;
                }
            }

            return null;
        }
    }
}
