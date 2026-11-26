// Services/IShoesService.cs
using ServerAPI.DTOs;
using ServerAPI.Models;
using ServerAPI.Models.Admin;
using ServerAPI.Models.Enums;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ServerAPI.Services
{
    public interface IShoesService
    {
        Task<List<ShoesDTO>> GetAllShoesAsync();
        Task<ShoesInventoryDto> GetShoesInventoryAsync();
        Task<ShoesDetailsDTO> GetShoeDetailsAsync(string id);
        Task<Shoes> AddShoeAsync(ShoesDTO newShoeDto);
        Task<List<ShoesDTO>> AddShoesBatchAsync(ShoesSize size, int count);
        Task<bool> UpdateShoeAsync(string id, ShoesDTO updatedShoeDto);
        Task<bool> DeleteShoeAsync(string id);
        Task<bool> DeleteOneFreeShoeBySizeAsync(ShoesSize size);
    }
}