using Microsoft.EntityFrameworkCore;
using ServerAPI.Common;
using ServerAPI.Data.Common.Repositories;
using ServerAPI.Models;
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
        private readonly ILogger<Workout> _logger;

        public WorkoutServices(
            IDeletableEntityRepository<Workout> workoutRepository,
            IDeletableEntityRepository<Appointment> appointmentRepository,
            IDeletableEntityRepository<Shoes> shoesRepository,
            IDeletableEntityRepository<WorkoutShoes> workoutShoesRepository,
            ILogger<Workout> logger)
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

            var existingShoes = await _shoesRepository.All().ToListAsync();
            var workoutShoes = existingShoes.Select(shoe => new WorkoutShoes
            {
                WorkoutId = workout.Id,
                ShoeId = shoe.Id,
                IsTaken = string.Equals(workout.Status, "Booked", StringComparison.OrdinalIgnoreCase)
            }).ToList();

            foreach (var workoutShoe in workoutShoes)
            {
                await _workoutShoesRepository.AddAsync(workoutShoe);
            }

            await _workoutShoesRepository.SaveChangesAsync();

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
                .AllAsNoTracking()
                .Where(w => w.Id == id)
                .Include(w => w.WorkoutShoes)
                    .ThenInclude(ws => ws.Shoe)
                .Include(w => w.Appointments)
                    .ThenInclude(a => a.User)
                .Include(w => w.Appointments)
                    .ThenInclude(a => a.Shoe)
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
                        .ToList(),
                    Appointments = w.Appointments
                        .Where(a => !a.IsDeleted)
                        .Select(a => new AppointmentViewModel
                        {
                            Id = a.Id,
                            UserId = a.UserId,
                            UserFullName = a.User != null ? (a.User.FirstName + " " + a.User.LastName).Trim() : "Deleted User",
                            UserEmail = a.User != null ? a.User.Email : string.Empty,
                            ShoeId = a.ShoeId,
                            CardType = a.CardType,
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
            var appointments = await _appointmentRepository.AllAsNoTracking()
                .Where(a => a.WorkoutId == workoutId)
                .Include(a => a.User)
                .Include(a => a.Shoe)
                .ToListAsync();

            return appointments.Select(a => new GetParticipantsModel
            {
                Id = a.UserId,
                FirstName = a.User?.FirstName,
                LastName = a.User?.LastName,
                Email = a.User?.Email,
                ShoeSize = a.Shoe?.Size,
                UsesOwnShoes = a.UsesOwnShoes,
            });
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

        public async Task<IEnumerable<AdminWorkoutViewModel>> GetAllWorkoutsAsync()
        {
            var workouts = await _workoutRepository.AllAsNoTracking()
                .OrderBy(w => w.Date)
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
                        .ToList(),
                    Appointments = w.Appointments
                        .Where(a => !a.IsDeleted)
                        .Select(a => new AppointmentViewModel
                        {
                            Id = a.Id,
                            UserId = a.UserId,
                            UserFullName = a.User != null ? (a.User.FirstName + " " + a.User.LastName).Trim() : "Deleted User",
                            UserEmail = a.User != null ? a.User.Email : string.Empty,
                            CardType = a.CardType,
                            ShoeId = a.ShoeId,
                            ShoeSize = a.Shoe != null ? a.Shoe.Size : (ShoesSize?)null,
                            UsesOwnShoes = a.UsesOwnShoes
                        }).ToList()
                })
                .ToListAsync();

            foreach (var workout in workouts)
            {
                workout.Date = BulgariaTimeHelper.SofiaToUtc(workout.Date);
            }

            return workouts;
        }
    }
}
