namespace ServerAPI.Controllers
{
    using Microsoft.AspNetCore.Cors;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.EntityFrameworkCore;
    using ServerAPI.Data;
    using ServerAPI.Models;

    [Route("/[controller]")]
    [EnableCors("AllowOrigin")]
    [ApiController]
    public class GalleryController : ControllerBase
    {
        private readonly JumpWithJennyDbContext _context;

        public GalleryController(JumpWithJennyDbContext context)
        {
            _context = context;
        }

        // GET: /gallery?page=1
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ImageModel>>> GetImages([FromQuery] int page = 1, [FromQuery] int pageSize = 4)
        {
            if (page < 1 || pageSize < 1)
            {
                return BadRequest("Invalid page number or page size.");
            }

            // Fetch the images from the database, adjusting based on page number and size
            var images = await _context.Images
                .OrderByDescending(i => i.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(images);
        }
    }
}