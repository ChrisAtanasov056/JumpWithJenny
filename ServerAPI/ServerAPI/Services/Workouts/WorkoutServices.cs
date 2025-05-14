using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ServerAPI.Data.Common.Repositories;
using ServerAPI.Models;
using ServerAPI.Models.Schedule;
using ServerAPI.Services.Mapper;
using ServerAPI.ViewModels;
using ServerAPI.ViewModels.Workout;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServerAPI.Services.Workouts
{
    public class WorkoutServices : IWorkoutServices
    {
        private readonly IDeletableEntityRepository<Workout> _workoutRepository;
        private readonly IDeletableEntityRepository<Appointment> _appointmentRepository;
        private readonly IDeletableEntityRepository<Shoes> _shoesRepository;
        private readonly IDeletableEntityRepository<WorkoutShoes> _workoutShoesRepository;

        private readonly IMapper _mapper;
        private readonly ILogger<Workout> _logger;

        public WorkoutServices(
            IDeletableEntityRepository<Workout> workoutRepository,
            IDeletableEntityRepository<Appointment> appointmentRepository,
            IDeletableEntityRepository<Shoes> shoesRepository,
            IDeletableEntityRepository<WorkoutShoes> workoutShoesRepository,
            ILogger<Workout> logger,
            IMapper mapper)
        {
            _workoutRepository = workoutRepository;
            _appointmentRepository = appointmentRepository;
            _shoesRepository = shoesRepository;
            _workoutShoesRepository = workoutShoesRepository;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<WorkoutCreateModel> CreateWorkoutAsync(WorkoutCreateModel dto)
        {
            // Create new workout
            var workout = new Workout
            {
                Day = dto.Day,
                Time = dto.Time,
                Status = "Available",
                AvailableSpots = dto.AvailableSpots
            };

            await _workoutRepository.AddAsync(workout);
            await _workoutRepository.SaveChangesAsync();

            // Get all existing shoes
            var existingShoes = await _shoesRepository.All().ToListAsync();

            // Create workout-shoe relationships
            var workoutShoes = existingShoes.Select(shoe => new WorkoutShoes
            {
                WorkoutId = workout.Id,
                ShoeId = shoe.Id,
                IsTaken = workout.Status == "Booked"
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
                Status = workout.Status,
                AvailableSpots = workout.AvailableSpots,
            };
        }

        public async Task<AdminWorkoutViewModel> GetWorkoutByIdAsync(string id)
        {
            var workout = await _workoutRepository
                .All()
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
                    Status = w.Status,
                    AvailableSpots = w.AvailableSpots,
                    WorkoutShoes = w.WorkoutShoes.ToList(),
                    Appointments = w.Appointments.Select(a => new AppointmentViewModel
                    {
                        Id = a.Id,
                        UserId = a.UserId,
                        UserFullName = a.User.FirstName + " " + a.User.LastName,
                        UserEmail = a.User.Email,
                        ShoeId = a.ShoeId,
                        ShoeSize = a.Shoe != null ? a.Shoe.Size : 0,
                        UsesOwnShoes = a.UsesOwnShoes,
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            return workout ?? throw new KeyNotFoundException($"Workout with ID {id} not found.");
        }


        public async Task DeleteWorkoutAsync(string id)
        {
            _logger.LogInformation($"Service layer - Deleting workout {id}");
            var workout = await _workoutRepository.All()
                .Include(w => w.WorkoutShoes)
                .FirstOrDefaultAsync(w => w.Id == id);

            _logger.LogInformation($"Deleting workout with ID: {id}");

            

            if (workout == null)
                {
                    _logger.LogDebug($"Workout lookup result: {(workout != null ? "Found" : "Not Found")}");
                throw new KeyNotFoundException("Workout not found");
                }
            // Delete related appointments
            var appointments = await _appointmentRepository.All()
                .Where(a => a.WorkoutId == id)
                .ToListAsync();
            foreach (var appointment in appointments)
            {
                _appointmentRepository.Delete(appointment);
            }

            // Delete workout-shoe relationships
            foreach (var workoutShoe in workout.WorkoutShoes)
            {
                _workoutShoesRepository.Delete(workoutShoe);
            }

            // Delete workout
            _workoutRepository.Delete(workout);
            await _workoutRepository.SaveChangesAsync();
        }

        public async Task<IEnumerable<GetParticipantsModel>> GetParticipantsAsync(string workoutId)
        {
            var appointments = await _appointmentRepository.All()
                .Where(a => a.WorkoutId == workoutId)
                .Include(a => a.User)
                .Include(a => a.Shoe)// .Include(a => a.Shoes) // Removed as 'Shoes' is not defined in 'Appointment'
                .ToListAsync();

            return appointments.Select(a => new GetParticipantsModel
            {
                Id = a.UserId,
                FirstName = a.User.FirstName,
                LastName = a.User.LastName,
                Email = a.User.Email,
                ShoeSize = a.Shoe.Size,
            });
        }

        public async Task<WorkoutUpdateModel> UpdateWorkoutAsync(string id, WorkoutUpdateModel dto)
        {
            var workout = await _workoutRepository.All()
                .Include(w => w.WorkoutShoes)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (workout == null)
                throw new KeyNotFoundException("Workout not found");

            // Update workout properties
            workout.Day = dto.Day;
            workout.Time = dto.Time;
            workout.AvailableSpots = dto.AvailableSpots;

            // Update workout-shoe relationships

            return new WorkoutUpdateModel
            {
                Id = workout.Id,
                Day = workout.Day,
                Time = workout.Time,
                AvailableSpots = workout.AvailableSpots
            };
        }
    }
}