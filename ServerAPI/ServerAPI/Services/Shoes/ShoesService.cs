// Services/ShoesService.cs

using Microsoft.EntityFrameworkCore;
using ServerAPI.Data;
using ServerAPI.Models;
using ServerAPI.DTOs;

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
            var shoes = await _context.Shoes.ToListAsync();
            return shoes.Select(s => new ShoesDTO
            {
                Id = s.Id,
                Size = s.Size
            }).ToList();
        }

        public async Task<ShoesDetailsDTO> GetShoeDetailsAsync(string id)
        {
            var shoe = await _context.Shoes
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
                Workouts = shoe.Workouts.Select(ws => new WorkoutDTO
                {
                    Id = ws.Workout.Id,
                    Date = ws.Workout.Date,
                    Day = ws.Workout.Day,
                    Time = ws.Workout.Time,
                }).ToList(),
                Users = shoe.UsersHistory.Select(uh => new UserDTO
                {
                    Id = uh.User.Id,
                    Username = uh.User.UserName,
                }).ToList()
            };
        }

        public async Task<Shoes> AddShoeAsync(ShoesDTO newShoeDto)
        {
            var newShoe = new Shoes
            {
                Size = newShoeDto.Size
            };
            
            _context.Shoes.Add(newShoe);
            await _context.SaveChangesAsync();
            return newShoe;
        }

        public async Task<bool> UpdateShoeAsync(string id, ShoesDTO updatedShoeDto)
        {
            var shoeToUpdate = await _context.Shoes.FindAsync(id);
            if (shoeToUpdate == null)
            {
                return false;
            }

            shoeToUpdate.Size = updatedShoeDto.Size;
            _context.Entry(shoeToUpdate).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteShoeAsync(string id)
        {
            var shoeToDelete = await _context.Shoes.FindAsync(id);
            if (shoeToDelete == null)
            {
                return false;
            }

            _context.Shoes.Remove(shoeToDelete);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}