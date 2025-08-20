// Services/IShoesService.cs
using ServerAPI.DTOs;
using ServerAPI.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ServerAPI.Services
{
    public interface IShoesService
    {
        Task<List<ShoesDTO>> GetAllShoesAsync();
        Task<ShoesDetailsDTO> GetShoeDetailsAsync(string id);
        Task<Shoes> AddShoeAsync(ShoesDTO newShoeDto);
        Task<bool> UpdateShoeAsync(string id, ShoesDTO updatedShoeDto);
        Task<bool> DeleteShoeAsync(string id);
    }
}