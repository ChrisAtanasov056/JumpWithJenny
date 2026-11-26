using System.Security.Cryptography;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using MimeKit;
using Npgsql;
using ServerAPI.Common;
using ServerAPI.Data;
using ServerAPI.Data.Common.Repositories;
using ServerAPI.Models;
using ServerAPI.Models.Admin;
using ServerAPI.Models.Enums;
using ServerAPI.Models.Schedule;

namespace ServerAPI.Services.Schedule
{
    public class ScheduleService : IScheduleService
    {
        private const int MaxActiveUpcomingBookingsPerEmail = 3;
        private static readonly Regex PhonePattern = new(@"^\+?[0-9\s\-()]{7,30}$", RegexOptions.Compiled);

        private readonly JumpWithJennyDbContext _context;
        private readonly IDeletableEntityRepository<Workout> _workoutRepository;
        private readonly IDeletableEntityRepository<Appointment> _appointmentRepository;
        private readonly IEmailService _emailService;
        private readonly ILogger<ScheduleService> _logger;

        public ScheduleService(
            JumpWithJennyDbContext context,
            IDeletableEntityRepository<Workout> workoutRepository,
            IDeletableEntityRepository<Appointment> appointmentRepository,
            IEmailService emailService,
            ILogger<ScheduleService> logger)
        {
            _context = context;
            _workoutRepository = workoutRepository;
            _appointmentRepository = appointmentRepository;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task<ApplyForWorkoutResult> ApplyForWorkoutAsync(
            ApplyForWorkoutRequest request,
            bool allowPastWorkout = false,
            bool enforceBookingLimits = true,
            bool sendConfirmationEmail = true,
            bool requireEmail = true,
            bool allowOverbooking = false)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.WorkoutId))
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.WorkoutNotFound,
                    "WORKOUT_NOT_FOUND",
                    "Workout ID is required.");
            }

            var trimmedName = request.FullName?.Trim() ?? string.Empty;
            if (trimmedName.Length < 2 || trimmedName.Length > 120)
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.InvalidFullName,
                    "INVALID_FULL_NAME",
                    "Full name must be between 2 and 120 characters.");
            }

            string trimmedEmail = null;
            string normalizedEmail = null;
            if (string.IsNullOrWhiteSpace(request.Email))
            {
                if (requireEmail)
                {
                    throw new ScheduleBookingException(
                        BookingErrorCode.InvalidEmail,
                        "INVALID_EMAIL",
                        "Please enter a valid email address.");
                }
            }
            else
            {
                trimmedEmail = request.Email.Trim();
                if (!IsValidEmailAddress(trimmedEmail))
                {
                    throw new ScheduleBookingException(
                        BookingErrorCode.InvalidEmail,
                        "INVALID_EMAIL",
                        "Please enter a valid email address.");
                }

                normalizedEmail = trimmedEmail.ToLowerInvariant();
            }

            var trimmedPhone = request.PhoneNumber?.Trim() ?? string.Empty;
            if (!IsValidPhoneNumber(trimmedPhone))
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.InvalidPhoneNumber,
                    "INVALID_PHONE_NUMBER",
                    "Please enter a valid phone number.");
            }

            if (!request.UsesOwnShoes && (!request.ShoeSize.HasValue || !Enum.IsDefined(typeof(ShoesSize), request.ShoeSize.Value)))
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.InvalidShoeSize,
                    "INVALID_SHOE_SIZE",
                    "Please select a valid shoe size.");
            }

            var workoutId = request.WorkoutId.Trim();
            var nowSofia = BulgariaTimeHelper.GetCurrentSofiaTime();
            var cancellationToken = GenerateCancellationToken();
            var workoutDay = string.Empty;
            var workoutTime = string.Empty;
            var workoutDateSofia = default(DateTime);
            WorkoutViewModels resultViewModel;

            await using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                var lockKey = normalizedEmail ?? $"phone:{trimmedPhone}";
                // Serialize concurrent bookings for the same email/phone so duplicate & max-3 limits cannot race.
                await _context.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtext({lockKey}))");

                var workout = await _workoutRepository.AllAsSplitQuery()
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

                if (!allowPastWorkout && workout.Date <= nowSofia)
                {
                    throw new ScheduleBookingException(
                        BookingErrorCode.WorkoutInPast,
                        "WORKOUT_PAST",
                        "Cannot register for a workout that has already started or passed.");
                }

                Appointment existingAppointment = null;
                if (normalizedEmail != null)
                {
                    existingAppointment = await _appointmentRepository.AllWithDeleted()
                        .FirstOrDefaultAsync(a => a.WorkoutId == workoutId && a.NormalizedEmail == normalizedEmail);

                    if (existingAppointment != null && !existingAppointment.IsDeleted)
                    {
                        throw new ScheduleBookingException(
                            BookingErrorCode.AlreadyRegistered,
                            "ALREADY_REGISTERED",
                            "This email is already registered for this workout.");
                    }
                }
                else
                {
                    var duplicateNoEmail = workout.Appointments.Any(a =>
                        !a.IsDeleted &&
                        string.Equals(a.FullName?.Trim(), trimmedName, StringComparison.OrdinalIgnoreCase) &&
                        string.Equals(a.PhoneNumber?.Trim(), trimmedPhone, StringComparison.OrdinalIgnoreCase));

                    if (duplicateNoEmail)
                    {
                        throw new ScheduleBookingException(
                            BookingErrorCode.AlreadyRegistered,
                            "ALREADY_REGISTERED",
                            "This participant is already registered for this workout.");
                    }
                }

                if (enforceBookingLimits && normalizedEmail != null)
                {
                    var activeUpcomingCount = await _appointmentRepository.AllAsNoTracking()
                        .CountAsync(a =>
                            a.NormalizedEmail == normalizedEmail &&
                            a.Workout != null &&
                            !a.Workout.IsDeleted &&
                            a.Workout.Date > nowSofia &&
                            a.Workout.Status != "Cancelled");

                    if (activeUpcomingCount >= MaxActiveUpcomingBookingsPerEmail)
                    {
                        throw new ScheduleBookingException(
                            BookingErrorCode.MaxActiveBookingsReached,
                            "MAX_ACTIVE_BOOKINGS",
                            "You can have at most 3 active upcoming workout bookings.");
                    }
                }

                if (string.Equals(workout.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
                {
                    throw new ScheduleBookingException(
                        BookingErrorCode.WorkoutNotAvailable,
                        "WORKOUT_NOT_AVAILABLE",
                        "This workout is not open for registration.");
                }

                if (!allowOverbooking)
                {
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
                }

                Shoes assignedShoe = null;

                if (!request.UsesOwnShoes)
                {
                    var workoutShoeToUpdate = workout.WorkoutShoes
                        .FirstOrDefault(ws =>
                            !ws.IsDeleted &&
                            ws.Shoe != null &&
                            !ws.Shoe.IsDeleted &&
                            ws.Shoe.Size == request.ShoeSize.Value &&
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
                    existingAppointment.UserId = null;
                    existingAppointment.FullName = trimmedName;
                    existingAppointment.Email = trimmedEmail;
                    existingAppointment.NormalizedEmail = normalizedEmail;
                    existingAppointment.PhoneNumber = trimmedPhone;
                    existingAppointment.CancellationToken = cancellationToken;
                    existingAppointment.CardType = null;
                    existingAppointment.ShoeId = assignedShoe?.Id;
                    existingAppointment.UsesOwnShoes = request.UsesOwnShoes;
                    existingAppointment.IsConfirmed = true;
                    existingAppointment.IsAttended = false;
                    existingAppointment.AttendedAt = null;

                    if (!workout.Appointments.Any(a => a.Id == existingAppointment.Id))
                    {
                        workout.Appointments.Add(existingAppointment);
                    }
                }
                else
                {
                    var appointment = new Appointment
                    {
                        UserId = null,
                        WorkoutId = workoutId,
                        FullName = trimmedName,
                        Email = trimmedEmail,
                        NormalizedEmail = normalizedEmail,
                        PhoneNumber = trimmedPhone,
                        CancellationToken = cancellationToken,
                        CardType = null,
                        ShoeId = assignedShoe?.Id,
                        UsesOwnShoes = request.UsesOwnShoes,
                        IsConfirmed = true,
                        IsAttended = false,
                        AttendedAt = null,
                    };

                    await _appointmentRepository.AddAsync(appointment);

                    if (!workout.Appointments.Contains(appointment))
                    {
                        workout.Appointments.Add(appointment);
                    }
                }

                if (workout.AvailableSpots > 0)
                {
                    workout.AvailableSpots -= 1;
                }

                if (workout.AvailableSpots <= 0)
                {
                    workout.AvailableSpots = 0;
                    if (string.Equals(workout.Status, "Available", StringComparison.OrdinalIgnoreCase))
                    {
                        workout.Status = "Booked";
                    }
                }

                try
                {
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                }
                catch (DbUpdateConcurrencyException ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogWarning(ex, "Concurrency conflict while booking workout {WorkoutId}", workoutId);
                    throw new ScheduleBookingException(
                        BookingErrorCode.ConcurrencyConflict,
                        "CONCURRENCY_CONFLICT",
                        "Workout availability changed concurrently. Please try again.",
                        ex);
                }
                catch (DbUpdateException ex)
                {
                    await transaction.RollbackAsync();
                    if (ex.InnerException is PostgresException pgEx &&
                        string.Equals(pgEx.ConstraintName, "IX_Appointments_WorkoutId_NormalizedEmail", StringComparison.Ordinal))
                    {
                        throw new ScheduleBookingException(
                            BookingErrorCode.AlreadyRegistered,
                            "ALREADY_REGISTERED",
                            "This email is already registered for this workout.",
                            ex);
                    }

                    _logger.LogWarning(ex, "Database constraint conflict while booking workout {WorkoutId}", workoutId);
                    throw new ScheduleBookingException(
                        BookingErrorCode.ConcurrencyConflict,
                        "CONCURRENCY_CONFLICT",
                        "Could not complete booking due to a concurrent update. Please try again.",
                        ex);
                }

                workoutDay = workout.Day;
                workoutTime = workout.Time;
                workoutDateSofia = workout.Date;
                resultViewModel = MapToWorkoutViewModel(workout);
            }

            if (sendConfirmationEmail && !string.IsNullOrWhiteSpace(trimmedEmail))
            {
                try
                {
                    var emailSent = await _emailService.SendBookingConfirmationEmailAsync(new BookingConfirmationEmailModel
                    {
                        ToEmail = trimmedEmail,
                        FullName = trimmedName,
                        PhoneNumber = trimmedPhone,
                        WorkoutDay = workoutDay,
                        WorkoutTime = workoutTime,
                        WorkoutDateSofia = workoutDateSofia,
                        ShoeSize = request.UsesOwnShoes ? null : request.ShoeSize,
                        UsesOwnShoes = request.UsesOwnShoes,
                        CancellationToken = cancellationToken,
                        Language = request.Language,
                    });

                    if (!emailSent)
                    {
                        _logger.LogWarning("Booking {WorkoutId} succeeded, but confirmation email failed to send.", workoutId);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unexpected error sending confirmation email for workout {WorkoutId}", workoutId);
                }
            }

            return new ApplyForWorkoutResult
            {
                Workout = resultViewModel,
                CancellationToken = cancellationToken,
            };
        }

        public async Task<string> UpdateParticipantAsync(string appointmentId, AdminUpdateParticipantRequest request)
        {
            if (string.IsNullOrWhiteSpace(appointmentId))
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.BookingNotFound,
                    "BOOKING_NOT_FOUND",
                    "Booking ID is required.");
            }

            if (request == null)
            {
                throw new ArgumentException("Participant payload is required.");
            }

            var trimmedName = request.FullName?.Trim() ?? string.Empty;
            if (trimmedName.Length < 2 || trimmedName.Length > 120)
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.InvalidFullName,
                    "INVALID_FULL_NAME",
                    "Full name must be between 2 and 120 characters.");
            }

            string trimmedEmail = null;
            string normalizedEmail = null;
            if (!string.IsNullOrWhiteSpace(request.Email))
            {
                trimmedEmail = request.Email.Trim();
                if (!IsValidEmailAddress(trimmedEmail))
                {
                    throw new ScheduleBookingException(
                        BookingErrorCode.InvalidEmail,
                        "INVALID_EMAIL",
                        "Please enter a valid email address.");
                }

                normalizedEmail = trimmedEmail.ToLowerInvariant();
            }

            var trimmedPhone = request.PhoneNumber?.Trim() ?? string.Empty;
            if (!IsValidPhoneNumber(trimmedPhone))
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.InvalidPhoneNumber,
                    "INVALID_PHONE_NUMBER",
                    "Please enter a valid phone number.");
            }

            if (!request.UsesOwnShoes && (!request.ShoeSize.HasValue || !Enum.IsDefined(typeof(ShoesSize), request.ShoeSize.Value)))
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.InvalidShoeSize,
                    "INVALID_SHOE_SIZE",
                    "Please select a valid shoe size.");
            }

            var normalizedAppointmentId = appointmentId.Trim();

            await using var transaction = await _context.Database.BeginTransactionAsync();

            var appointment = await _appointmentRepository.All()
                .FirstOrDefaultAsync(a => a.Id == normalizedAppointmentId);

            if (appointment == null)
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.BookingNotFound,
                    "BOOKING_NOT_FOUND",
                    "Participant registration not found.");
            }

            var workout = await _workoutRepository.AllAsSplitQuery()
                .Include(w => w.WorkoutShoes)
                    .ThenInclude(ws => ws.Shoe)
                .Include(w => w.Appointments)
                .FirstOrDefaultAsync(w => w.Id == appointment.WorkoutId);

            if (workout == null)
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.WorkoutNotFound,
                    "WORKOUT_NOT_FOUND",
                    "Workout not found.");
            }

            if (normalizedEmail != null)
            {
                var emailTaken = workout.Appointments.Any(a =>
                    a.Id != appointment.Id &&
                    !a.IsDeleted &&
                    string.Equals(a.NormalizedEmail, normalizedEmail, StringComparison.OrdinalIgnoreCase));

                if (emailTaken)
                {
                    throw new ScheduleBookingException(
                        BookingErrorCode.AlreadyRegistered,
                        "ALREADY_REGISTERED",
                        "This email is already registered for this workout.");
                }
            }
            else
            {
                var duplicateNoEmail = workout.Appointments.Any(a =>
                    a.Id != appointment.Id &&
                    !a.IsDeleted &&
                    a.NormalizedEmail == null &&
                    string.Equals(a.FullName?.Trim(), trimmedName, StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(a.PhoneNumber?.Trim(), trimmedPhone, StringComparison.OrdinalIgnoreCase));

                if (duplicateNoEmail)
                {
                    throw new ScheduleBookingException(
                        BookingErrorCode.AlreadyRegistered,
                        "ALREADY_REGISTERED",
                        "This participant is already registered for this workout.");
                }
            }

            var oldWorkoutShoe = !string.IsNullOrEmpty(appointment.ShoeId)
                ? workout.WorkoutShoes.FirstOrDefault(ws => !ws.IsDeleted && ws.ShoeId == appointment.ShoeId)
                : null;

            if (request.UsesOwnShoes)
            {
                if (oldWorkoutShoe != null)
                {
                    oldWorkoutShoe.IsTaken = false;
                }

                appointment.ShoeId = null;
                appointment.UsesOwnShoes = true;
            }
            else
            {
                var requestedSize = request.ShoeSize.Value;
                var keepsCurrentShoe = oldWorkoutShoe != null &&
                    oldWorkoutShoe.Shoe != null &&
                    !oldWorkoutShoe.Shoe.IsDeleted &&
                    oldWorkoutShoe.Shoe.Size == requestedSize;

                if (!keepsCurrentShoe)
                {
                    var newWorkoutShoe = workout.WorkoutShoes
                        .FirstOrDefault(ws =>
                            !ws.IsDeleted &&
                            ws.Shoe != null &&
                            !ws.Shoe.IsDeleted &&
                            ws.Shoe.Size == requestedSize &&
                            !ws.IsTaken);

                    if (newWorkoutShoe == null)
                    {
                        throw new ScheduleBookingException(
                            BookingErrorCode.NoAvailableShoes,
                            "NO_AVAILABLE_SHOES",
                            "No available shoes of the requested size.");
                    }

                    if (oldWorkoutShoe != null)
                    {
                        oldWorkoutShoe.IsTaken = false;
                    }

                    newWorkoutShoe.IsTaken = true;
                    appointment.ShoeId = newWorkoutShoe.ShoeId;
                }

                appointment.UsesOwnShoes = false;
            }

            appointment.FullName = trimmedName;
            appointment.Email = trimmedEmail;
            appointment.NormalizedEmail = normalizedEmail;
            appointment.PhoneNumber = trimmedPhone;

            try
            {
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return workout.Id;
            }
            catch (DbUpdateConcurrencyException ex)
            {
                await transaction.RollbackAsync();
                _logger.LogWarning(ex, "Concurrency conflict while updating appointment {AppointmentId}", appointment.Id);
                throw new ScheduleBookingException(
                    BookingErrorCode.ConcurrencyConflict,
                    "CONCURRENCY_CONFLICT",
                    "Workout availability changed concurrently. Please try again.",
                    ex);
            }
            catch (DbUpdateException ex)
            {
                await transaction.RollbackAsync();
                if (ex.InnerException is PostgresException pgEx &&
                    string.Equals(pgEx.ConstraintName, "IX_Appointments_WorkoutId_NormalizedEmail", StringComparison.Ordinal))
                {
                    throw new ScheduleBookingException(
                        BookingErrorCode.AlreadyRegistered,
                        "ALREADY_REGISTERED",
                        "This email is already registered for this workout.",
                        ex);
                }

                _logger.LogWarning(ex, "Database conflict while updating appointment {AppointmentId}", appointment.Id);
                throw new ScheduleBookingException(
                    BookingErrorCode.ConcurrencyConflict,
                    "CONCURRENCY_CONFLICT",
                    "Could not update participant due to a concurrent update. Please try again.",
                    ex);
            }
        }

        public async Task<bool> SetParticipantAttendanceAsync(string appointmentId, bool isAttended)
        {
            if (string.IsNullOrWhiteSpace(appointmentId))
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.BookingNotFound,
                    "BOOKING_NOT_FOUND",
                    "Booking ID is required.");
            }

            var normalizedId = appointmentId.Trim();
            var appointment = await _appointmentRepository.All()
                .FirstOrDefaultAsync(a => a.Id == normalizedId);

            if (appointment == null)
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.BookingNotFound,
                    "BOOKING_NOT_FOUND",
                    "Participant registration not found.");
            }

            appointment.IsAttended = isAttended;
            appointment.AttendedAt = isAttended ? DateTime.UtcNow : null;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<BookingCancellationDetailsDto> GetCancellationDetailsByTokenAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.BookingNotFound,
                    "BOOKING_NOT_FOUND",
                    "Booking not found or already cancelled.");
            }

            var normalizedToken = token.Trim();
            var appointment = await _appointmentRepository.AllAsNoTracking()
                .Include(a => a.Workout)
                .Include(a => a.Shoe)
                .FirstOrDefaultAsync(a => a.CancellationToken == normalizedToken);

            if (appointment == null || appointment.Workout == null || appointment.Workout.IsDeleted)
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.BookingNotFound,
                    "BOOKING_NOT_FOUND",
                    "Booking not found or already cancelled.");
            }

            return new BookingCancellationDetailsDto
            {
                AppointmentId = appointment.Id,
                FullName = appointment.FullName,
                Email = appointment.Email,
                PhoneNumber = appointment.PhoneNumber,
                WorkoutId = appointment.WorkoutId,
                WorkoutDay = appointment.Workout.Day,
                WorkoutTime = appointment.Workout.Time,
                WorkoutDate = BulgariaTimeHelper.SofiaToUtc(appointment.Workout.Date),
                ShoeSize = appointment.Shoe?.Size,
                UsesOwnShoes = appointment.UsesOwnShoes,
                CanCancel = appointment.Workout.Date > BulgariaTimeHelper.GetCurrentSofiaTime(),
            };
        }

        public async Task<bool> CancelByTokenAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.BookingNotFound,
                    "BOOKING_NOT_FOUND",
                    "Booking not found or already cancelled.");
            }

            var normalizedToken = token.Trim();
            return await CancelAppointmentInternalAsync(
                a => a.CancellationToken == normalizedToken,
                allowPastWorkout: false,
                throwIfNotFound: true);
        }

        public Task<bool> CancelRegistrationByIdAsync(string appointmentId, bool allowPastWorkout = false)
        {
            if (string.IsNullOrWhiteSpace(appointmentId))
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.BookingNotFound,
                    "BOOKING_NOT_FOUND",
                    "Booking ID is required.");
            }

            var normalizedId = appointmentId.Trim();
            return CancelAppointmentInternalAsync(
                a => a.Id == normalizedId,
                allowPastWorkout: allowPastWorkout,
                throwIfNotFound: false);
        }

        private async Task<bool> CancelAppointmentInternalAsync(
            System.Linq.Expressions.Expression<Func<Appointment, bool>> predicate,
            bool allowPastWorkout,
            bool throwIfNotFound)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();

            var appointment = await _appointmentRepository.All()
                .FirstOrDefaultAsync(predicate);

            if (appointment == null)
            {
                if (throwIfNotFound)
                {
                    throw new ScheduleBookingException(
                        BookingErrorCode.BookingNotFound,
                        "BOOKING_NOT_FOUND",
                        "Booking not found or already cancelled.");
                }

                return false;
            }

            var workout = await _workoutRepository.All()
                .Include(w => w.WorkoutShoes)
                .FirstOrDefaultAsync(w => w.Id == appointment.WorkoutId);

            if (workout == null)
            {
                throw new ScheduleBookingException(
                    BookingErrorCode.WorkoutNotFound,
                    "WORKOUT_NOT_FOUND",
                    "Workout not found.");
            }

            if (!allowPastWorkout && workout.Date <= BulgariaTimeHelper.GetCurrentSofiaTime())
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
                _logger.LogWarning(ex, "Concurrency conflict while canceling appointment {AppointmentId} in workout {WorkoutId}", appointment.Id, appointment.WorkoutId);
                throw new ScheduleBookingException(
                    BookingErrorCode.ConcurrencyConflict,
                    "CONCURRENCY_CONFLICT",
                    "Workout availability changed concurrently. Please try again.",
                    ex);
            }
        }

        public async Task<List<WorkoutViewModels>> GetAllWorkoutsAsync(
            int page = 1,
            int pageSize = 50,
            CancellationToken cancellationToken = default)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);
            var nowSofia = BulgariaTimeHelper.GetCurrentSofiaTime();

            var workouts = await _workoutRepository
                .AllAsNoTrackingSplitQuery()
                .Where(w => w.Date > nowSofia)
                .OrderBy(w => w.Date)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(w => w.WorkoutShoes)
                    .ThenInclude(ws => ws.Shoe)
                .Include(w => w.Appointments)
                .ToListAsync(cancellationToken);

            return workouts.Select(MapToWorkoutViewModel).ToList();
        }

        public async Task<WorkoutViewModels> GetWorkoutByIdAsync(string id)
        {
            var workout = await _workoutRepository
                .AllAsNoTrackingSplitQuery()
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
                Date = BulgariaTimeHelper.SofiaToUtc(workout.Date),
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

        private static string GenerateCancellationToken()
        {
            return Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        }

        private static bool IsValidEmailAddress(string email)
        {
            if (string.IsNullOrWhiteSpace(email) || email.Length > 254)
            {
                return false;
            }

            if (!MailboxAddress.TryParse(email, out var parsed) || !string.Equals(parsed.Address, email, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            var atIndex = email.IndexOf('@');
            if (atIndex <= 0 || atIndex == email.Length - 1)
            {
                return false;
            }

            var domainPart = email[(atIndex + 1)..];
            return domainPart.Contains('.') && !domainPart.StartsWith('.') && !domainPart.EndsWith('.');
        }

        private static bool IsValidPhoneNumber(string phone)
        {
            if (string.IsNullOrWhiteSpace(phone) || phone.Length > 30 || !PhonePattern.IsMatch(phone))
            {
                return false;
            }

            var digitCount = phone.Count(char.IsDigit);
            return digitCount >= 7 && digitCount <= 15;
        }
    }
}
