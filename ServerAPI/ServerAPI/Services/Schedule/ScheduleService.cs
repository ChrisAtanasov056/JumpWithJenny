﻿using Microsoft.EntityFrameworkCore;
using ServerAPI.Data.Common.Repositories;
using ServerAPI.Models;
using ServerAPI.Models.Enums;
using ServerAPI.Services.Mapper;

namespace ServerAPI.Services.Schedule
{
    public class ScheduleService : IScheduleService
    {
        private readonly IDeletableEntityRepository<Workout> _workoutRepository;
        private readonly IDeletableEntityRepository<Appointment> _appointmentRepository;
        private readonly IDeletableEntityRepository<Shoes> _shoesRepository;
        private readonly IDeletableEntityRepository<User> _usersRepository;

        public ScheduleService(
            IDeletableEntityRepository<Workout> workoutRepository,
            IDeletableEntityRepository<Appointment> appointmentRepository,
            IDeletableEntityRepository<Shoes> shoesRepository,
            IDeletableEntityRepository<User> usersRepository)
        {
            _workoutRepository = workoutRepository;
            _appointmentRepository = appointmentRepository;
            _shoesRepository = shoesRepository;
            _usersRepository = usersRepository;
        }

        public async Task<Workout> ApplyForWorkoutAsync(string workoutId, ShoesSize shoeSize, CardType cardType, string userId, bool usesOwnShoes)
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
                // If anything fails, the changes won't be persisted
                return null;
            }
        }

        public async Task<List<T>> GetAllWorkoutsAsync<T>()
        {
            var workouts = await _workoutRepository
                .All()
                .Include(w => w.WorkoutShoes)
                .ThenInclude(ws => ws.Shoe)
                .Include(w => w.Appointments)
                .To<T>()
                .ToListAsync();

            return workouts ?? new List<T>();
        }

        public async Task<T> GetWorkoutByIdAsync<T>(string id)
        {
            var workout = await _workoutRepository
                .All()
                .Where(w => w.Id == id)
                .Include(w => w.WorkoutShoes)
                .ThenInclude(ws => ws.Shoe)
                .Include(w => w.Appointments)
                .To<T>()
                .FirstOrDefaultAsync();

            return workout ?? throw new KeyNotFoundException($"Workout with ID {id} not found.");
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

            // Remove the appointment
            _workoutRepository.All().FirstOrDefault(w => w.Id == workoutId).AvailableSpots += 1;
            _appointmentRepository.HardDelete(appointment);
            await _appointmentRepository.SaveChangesAsync();
            await _workoutRepository.SaveChangesAsync();

            return true; // Registration canceled successfully
        }
    }
}