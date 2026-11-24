using Microsoft.EntityFrameworkCore;
using ServerAPI.Data;
using ServerAPI.Data.Common.Repositories;
using ServerAPI.Models;
using ServerAPI.Models.Enums;
using ServerAPI.Models.Schedule;

namespace ServerAPI.Services.Schedule
{
    public class ScheduleService : IScheduleService
    {
        private static readonly TimeZoneInfo BulgariaTimeZone =
            TimeZoneInfo.FindSystemTimeZoneById("Europe/Sofia");

        private readonly JumpWithJennyDbContext _context;
        private readonly IDeletableEntityRepository<Workout> _workoutRepository;
        private readonly IDeletableEntityRepository<Appointment> _appointmentRepository;
        private readonly IDeletableEntityRepository<User> _usersRepository;
        private readonly ILogger<ScheduleService> _logger;

        public ScheduleService(
            JumpWithJennyDbContext context,
            IDeletableEntityRepository<Workout> workoutRepository,
            IDeletableEntityRepository<Appointment> appointmentRepository,
            IDeletableEntityRepository<User> usersRepository,
            ILogger<ScheduleService> logger)
        {
            _context = context;
            _workoutRepository = workoutRepository;
            _appointmentRepository = appointmentRepository;
            _usersRepository = usersRepository;
            _logger = logger;
        }

        private static DateTime GetCurrentLocalTime() =>
            TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, BulgariaTimeZone);

        public async Task<WorkoutViewModels> ApplyForWorkoutAsync(
            string workoutId,
            ShoesSize? shoeSize,
            CardType cardType,
            string userId,
            bool usesOwnShoes,
            bool requireConfirmedEmail = true)
        {
            if (string.IsNullOrWhiteSpace(workoutId))
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.WorkoutNotFound,
                    "WORKOUT_NOT_FOUND",
                    "Workout ID is required.");
            }

            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.UserNotFound,
                    "USER_NOT_FOUND",
                    "User ID is required.");
            }

            if (!Enum.IsDefined(typeof(CardType), cardType))
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.InvalidCardType,
                    "INVALID_CARD_TYPE",
                    "Invalid workout card type.");
            }

            if (!usesOwnShoes && (!shoeSize.HasValue || !Enum.IsDefined(typeof(ShoesSize), shoeSize.Value)))
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.InvalidShoeSize,
                    "INVALID_SHOE_SIZE",
                    "Please select a valid shoe size.");
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();

            var user = await _usersRepository.AllAsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.UserNotFound,
                    "USER_NOT_FOUND",
                    "User not found.");
            }

            if (requireConfirmedEmail && !user.EmailConfirmed)
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.EmailNotConfirmed,
                    "EMAIL_NOT_CONFIRMED",
                    "Please confirm your email address before registering for a workout.");
            }

            var workout = await _workoutRepository.All()
                .Include(w => w.WorkoutShoes)
                    .ThenInclude(ws => ws.Shoe)
                .Include(w => w.Appointments)
                .FirstOrDefaultAsync(w => w.Id == workoutId);

            if (workout == null)
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.WorkoutNotFound,
                    "WORKOUT_NOT_FOUND",
                    "Workout not found.");
            }

            if (workout.Date <= GetCurrentLocalTime())
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.WorkoutInPast,
                    "WORKOUT_PAST",
                    "Cannot register for a workout that has already started or passed.");
            }

            var existingAppointment = await _appointmentRepository.AllWithDeleted()
                .FirstOrDefaultAsync(a => a.WorkoutId == workoutId && a.UserId == userId);

            if (existingAppointment != null && !existingAppointment.IsDeleted)
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.AlreadyRegistered,
                    "ALREADY_REGISTERED",
                    "User is already registered for this workout.");
            }

            if (!string.Equals(workout.Status, "Available", StringComparison.OrdinalIgnoreCase))
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.WorkoutNotAvailable,
                    "WORKOUT_NOT_AVAILABLE",
                    "This workout is not open for registration.");
            }

            if (workout.AvailableSpots <= 0)
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.NoAvailableSpots,
                    "NO_AVAILABLE_SPOTS",
                    "No available spots left for this workout.");
            }

            Shoes assignedShoe = null;

            if (!usesOwnShoes)
            {
                var workoutShoeToUpdate = workout.WorkoutShoes
                    .FirstOrDefault(ws =>
                        !ws.IsDeleted &&
                        ws.Shoe != null &&
                        !ws.Shoe.IsDeleted &&
                        ws.Shoe.Size == shoeSize.Value &&
                        !ws.IsTaken);

                if (workoutShoeToUpdate == null)
                {
                    throw new ScheduleBookingException(
                        BookingErrorCode.NoAvailableShoes,
                        "NO_AVAILABLE_SHOES",
                        "No available shoes of the requested size.");
                }

                assignedShoe = workoutShoeToUpdate.Shoe;
                workoutShoeToUpdate.IsTaken = true;
            }

            if (existingAppointment != null && existingAppointment.IsDeleted)
            {
                _appointmentRepository.Undelete(existingAppointment);
                existingAppointment.CardType = cardType;
                existingAppointment.ShoeId = assignedShoe?.Id;
                existingAppointment.UsesOwnShoes = usesOwnShoes;
                existingAppointment.IsConfirmed = true;

                if (!workout.Appointments.Any(a => a.UserId == userId && a.WorkoutId == workoutId))
                {
                    workout.Appointments.Add(existingAppointment);
                }
            }
            else
            {
                var appointment = new Appointment
                {
                    UserId = userId,
                    WorkoutId = workoutId,
                    CardType = cardType,
                    ShoeId = assignedShoe?.Id,
                    UsesOwnShoes = usesOwnShoes,
                    IsConfirmed = true
                };

                await _appointmentRepository.AddAsync(appointment);

                if (!workout.Appointments.Contains(appointment))
                {
                    workout.Appointments.Add(appointment);
                }
            }

            workout.AvailableSpots -= 1;
            if (workout.AvailableSpots <= 0)
            {
                workout.AvailableSpots = 0;
                workout.Status = "Booked";
            }

            try
            {
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return MapToWorkoutViewModel(workout);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                await transaction.RollbackAsync();
                _logger.LogWarning(ex, "Concurrency conflict while applying user {UserId} to workout {WorkoutId}", userId, workoutId);
                throw new ScheduleBookingException(
                    BookingErrorCode.ConcurrencyConflict,
                    "CONCURRENCY_CONFLICT",
                    "Workout availability changed concurrently. Please try again.",
                    ex);
            }
            catch (DbUpdateException ex)
            {
                await transaction.RollbackAsync();
                _logger.LogWarning(ex, "Database constraint conflict while applying user {UserId} to workout {WorkoutId}", userId, workoutId);
                throw new ScheduleBookingException(
                    BookingErrorCode.ConcurrencyConflict,
                    "CONCURRENCY_CONFLICT",
                    "Could not complete booking due to a concurrent update. Please try again.",
                    ex);
            }
        }

        public async Task<List<WorkoutViewModels>> GetAllWorkoutsAsync()
        {
            var today = GetCurrentLocalTime().Date;

            var workouts = await _workoutRepository
                .AllAsNoTracking()
                .Where(w => w.Date >= today)
                .Include(w => w.WorkoutShoes)
                    .ThenInclude(ws => ws.Shoe)
                .Include(w => w.Appointments)
                .ToListAsync();

            return workouts.Select(MapToWorkoutViewModel).ToList();
        }

        public async Task<WorkoutViewModels> GetWorkoutByIdAsync(string id)
        {
            var workout = await _workoutRepository
                .AllAsNoTracking()
                .Where(w => w.Id == id)
                .Include(w => w.WorkoutShoes)
                    .ThenInclude(ws => ws.Shoe)
                .Include(w => w.Appointments)
                .FirstOrDefaultAsync();

            if (workout == null)
            {
                throw new KeyNotFoundException($"Workout with ID {id} not found.");
            }

            return MapToWorkoutViewModel(workout);
        }

        private static WorkoutViewModels MapToWorkoutViewModel(Workout workout)
        {
            var activeAppointmentsCount = workout.Appointments?.Count(a => !a.IsDeleted) ?? 0;
            var totalSpots = workout.AvailableSpots + activeAppointmentsCount;

            return new WorkoutViewModels
            {
                Id = workout.Id,
                Day = workout.Day,
                Time = workout.Time,
                Status = workout.Status,
                AvailableSpots = workout.AvailableSpots,
                TakenSpots = activeAppointmentsCount,
                TotalSpots = totalSpots,
                Date = workout.Date,
                WorkoutShoes = (workout.WorkoutShoes ?? Enumerable.Empty<WorkoutShoes>())
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
                        },
                    })
                    .ToList(),
            };
        }

        public async Task<bool> IsUserRegisteredAsync(string workoutId, string userId)
        {
            var userExists = await _usersRepository.AllAsNoTracking()
                .AnyAsync(u => u.Id == userId);

            if (!userExists)
            {
                throw new KeyNotFoundException($"User with ID {userId} not found.");
            }

            return await _appointmentRepository.AllAsNoTracking()
                .AnyAsync(a => a.WorkoutId == workoutId && a.UserId == userId);
        }

        public async Task<bool> CancelRegistrationAsync(string workoutId, string userId, bool allowPastWorkout = false)
        {
            if (string.IsNullOrWhiteSpace(workoutId))
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.WorkoutNotFound,
                    "WORKOUT_NOT_FOUND",
                    "Workout ID is required.");
            }

            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.UserNotFound,
                    "USER_NOT_FOUND",
                    "User ID is required.");
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();

            var appointment = await _appointmentRepository.All()
                .FirstOrDefaultAsync(a => a.WorkoutId == workoutId && a.UserId == userId);

            if (appointment == null)
            {
                return false;
            }

            var workout = await _workoutRepository.All()
                .Include(w => w.WorkoutShoes)
                .FirstOrDefaultAsync(w => w.Id == workoutId);

            if (workout == null)
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.WorkoutNotFound,
                    "WORKOUT_NOT_FOUND",
                    "Workout not found.");
            }

            if (!allowPastWorkout && workout.Date <= GetCurrentLocalTime())
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.WorkoutInPast,
                    "WORKOUT_PAST",
                    "Cannot cancel registration for a workout that has already started or passed.");
            }

            workout.AvailableSpots += 1;
            if (string.Equals(workout.Status, "Booked", StringComparison.OrdinalIgnoreCase) && workout.AvailableSpots > 0)
            {
                workout.Status = "Available";
            }

            if (!string.IsNullOrEmpty(appointment.ShoeId))
            {
                var workoutShoe = workout.WorkoutShoes?.FirstOrDefault(ws => ws.ShoeId == appointment.ShoeId);
                if (workoutShoe != null)
                {
                    workoutShoe.IsTaken = false;
                }
                else
                {
                    _logger.LogWarning("No matching shoe found for appointment.ShoeId = {ShoeId}", appointment.ShoeId);
                }
            }
            else
            {
                _logger.LogInformation("User {UserId} canceled registration with own shoes — skipping shoe release.", userId);
            }

            _appointmentRepository.HardDelete(appointment);

            try
            {
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return true;
            }
            catch (DbUpdateConcurrencyException ex)
            {
                await transaction.RollbackAsync();
                _logger.LogWarning(ex, "Concurrency conflict while canceling registration for user {UserId} in workout {WorkoutId}", userId, workoutId);
                throw new ScheduleBookingException(
                    BookingErrorCode.ConcurrencyConflict,
                    "CONCURRENCY_CONFLICT",
                    "Workout availability changed concurrently. Please try again.",
                    ex);
            }
        }
    }
}
