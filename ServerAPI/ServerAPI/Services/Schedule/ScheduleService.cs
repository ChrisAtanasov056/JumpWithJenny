using Microsoft.EntityFrameworkCore;
using ServerAPI.Data.Common.Repositories;
using ServerAPI.Models;
using ServerAPI.Models.Enums;
using ServerAPI.Models.Schedule;

namespace ServerAPI.Services.Schedule
{
    public class ScheduleService : IScheduleService
    {
        private readonly IDeletableEntityRepository<Workout> _workoutRepository;
        private readonly IDeletableEntityRepository<Appointment> _appointmentRepository;
        private readonly IDeletableEntityRepository<Shoes> _shoesRepository;
        private readonly IDeletableEntityRepository<User> _usersRepository;

        private readonly ILogger<ScheduleService> _logger;

        public ScheduleService(
            IDeletableEntityRepository<Workout> workoutRepository,
            IDeletableEntityRepository<Appointment> appointmentRepository,
            IDeletableEntityRepository<Shoes> shoesRepository,
            IDeletableEntityRepository<User> usersRepository,
            ILogger<ScheduleService> logger)
        {
            _workoutRepository = workoutRepository;
            _appointmentRepository = appointmentRepository;
            _shoesRepository = shoesRepository;
            _usersRepository = usersRepository;
            _logger = logger;
        }

        public async Task<Workout> ApplyForWorkoutAsync(string workoutId, ShoesSize? shoeSize, CardType cardType, string userId, bool usesOwnShoes)
        {
            // First get the workout with all necessary includes
            var workout = await _workoutRepository.All()
                .Include(w => w.WorkoutShoes)
                .ThenInclude(ws => ws.Shoe)
                .Include(w => w.Appointments)
                .FirstOrDefaultAsync(w => w.Id == workoutId);

            if (workout == null)
            {
                
                return null; // Workout not found
            }

            if (workout.Appointments.Count >= 20)
            {
                return null; // Workout is already full
            }

            Shoes assignedShoe = null;
            WorkoutShoes workoutShoeToUpdate = null;

            if (!usesOwnShoes)
            {
                // Find the first available shoe of the requested size
                workoutShoeToUpdate = workout.WorkoutShoes
                    .FirstOrDefault(ws => ws.Shoe.Size == shoeSize && !ws.IsTaken);

                if (workoutShoeToUpdate == null)
                {
                    return null; // No available shoe of requested size
                }

                assignedShoe = workoutShoeToUpdate.Shoe;
                workoutShoeToUpdate.IsTaken = true; // Mark the shoe as taken

                // Explicitly update the WorkoutShoes entity
                _workoutRepository.Update(workout);
            }
            // Create appointment
            var appointment = new Appointment
            {
                UserId = userId,
                WorkoutId = workoutId,
                CardType = cardType,
                ShoeId = assignedShoe?.Id, // Null if using own shoes
                UsesOwnShoes = usesOwnShoes,
                IsConfirmed = true
            };

            // Update available spots
            workout.AvailableSpots -= 1;

            try
            {
                // Add the appointment
                await _appointmentRepository.AddAsync(appointment);

                // Save all changes
                await _workoutRepository.SaveChangesAsync();
                await _appointmentRepository.SaveChangesAsync();

                if (workoutShoeToUpdate != null)
                {
                    await _shoesRepository.SaveChangesAsync();
                }

                return workout;
            }
            catch
            {
                return null;
            }
        }

        public async Task<List<WorkoutViewModels>> GetAllWorkoutsAsync()
        {
            var today = DateTime.UtcNow.Date;

            var workouts = await _workoutRepository
                .AllAsNoTracking()
                .Where(w => w.Date >= today)
                .Include(w => w.WorkoutShoes)
                    .ThenInclude(ws => ws.Shoe)
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
                .FirstOrDefaultAsync();

            if (workout == null)
            {
                throw new KeyNotFoundException($"Workout with ID {id} not found.");
            }

            return MapToWorkoutViewModel(workout);
        }

        private static WorkoutViewModels MapToWorkoutViewModel(Workout workout)
        {
            return new WorkoutViewModels
            {
                Id = workout.Id,
                Day = workout.Day,
                Time = workout.Time,
                Status = workout.Status,
                AvailableSpots = workout.AvailableSpots,
                Date = workout.Date,
                WorkoutShoes = workout.WorkoutShoes
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
                        Shoe = ws.Shoe == null
                            ? null
                            : new Shoes
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
            // First check if user exists
            var userExists = await _usersRepository.All()
                .AnyAsync(u => u.Id == userId);
            
            if (!userExists)
            {
                throw new KeyNotFoundException($"User with ID {userId} not found.");
            }

            // Check if user is registered for the workout
            return await _usersRepository.All()
                .Where(u => u.Id == userId)
                .SelectMany(u => u.Appointments)
                .AnyAsync(a => a.WorkoutId == workoutId);
        }

        public async Task<bool> CancelRegistrationAsync(string workoutId, string userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                throw new ArgumentException("User ID is required.");
            }

            // Find the appointment
            var appointment = await _appointmentRepository.All()
                .FirstOrDefaultAsync(a => a.WorkoutId == workoutId && a.UserId == userId);

            if (appointment == null)
            {
                return false; // Registration not found
            }

            // Find the workout
            var workout = await _workoutRepository.All()
                .Include(w => w.WorkoutShoes)
                .FirstOrDefaultAsync(w => w.Id == workoutId);

            if (workout == null)
            {
                throw new InvalidOperationException("Workout not found.");
            }

            // Update available spots only if the workout is found
            workout.AvailableSpots += 1;

            // Only process shoe release if user used one from the workout
            if (appointment.ShoeId != null)
            {
                var workoutShoe = workout.WorkoutShoes?.FirstOrDefault(ws => ws.ShoeId == appointment.ShoeId);
                if (workoutShoe != null)
                {
                    workoutShoe.IsTaken = false;
                }
                else
                {
                    _logger.LogWarning($"No matching shoe found for appointment.ShoeId = {appointment.ShoeId}");
                }
            }
            else
            {
                _logger.LogInformation($"User {userId} canceled registration with own shoes — skipping shoe release.");
            }

            // Remove the appointment
            _appointmentRepository.HardDelete(appointment);
            await _appointmentRepository.SaveChangesAsync();
            await _workoutRepository.SaveChangesAsync();

            return true; // Registration canceled successfully
        }
    }   
}