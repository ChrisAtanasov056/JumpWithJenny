// Controllers/ShoesController.cs
using Microsoft.AspNetCore.Mvc;
using ServerAPI.DTOs;
using ServerAPI.Services;

namespace ServerAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShoesController : ControllerBase
    {
        private readonly IShoesService _shoesService;

        public ShoesController(IShoesService shoesService) 
        {
            _shoesService = shoesService;
        }

        // GET: api/shoes
        [HttpGet]
        public async Task<IActionResult> GetAllShoes()
        {
            var shoesDto = await _shoesService.GetAllShoesAsync();
            return Ok(shoesDto);
        }

        // GET: api/shoes/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetShoeById(string id)
        {
            var shoeDetails = await _shoesService.GetShoeDetailsAsync(id);

            if (shoeDetails == null)
            {
                return NotFound();
            }

            return Ok(shoeDetails);
        }

        // POST: api/shoes
        [HttpPost]
        public async Task<IActionResult> AddShoe([FromBody] ShoesDTO newShoeDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var newShoe = await _shoesService.AddShoeAsync(newShoeDto);
            return CreatedAtAction(nameof(GetShoeById), new { id = newShoe.Id }, newShoe);
        }

        // PUT: api/shoes/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateShoe(string id, [FromBody] ShoesDTO updatedShoeDto)
        {
            if (id != updatedShoeDto.Id)
            {
                return BadRequest("ID mismatch.");
            }

            var result = await _shoesService.UpdateShoeAsync(id, updatedShoeDto);
            if (!result)
            {
                return NotFound();
            }

            return NoContent();
        }

        // DELETE: api/shoes/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteShoe(string id)
        {
            var result = await _shoesService.DeleteShoeAsync(id);
            if (!result)
            {
                return NotFound();
            }
            
            return NoContent();
        }
    }
}