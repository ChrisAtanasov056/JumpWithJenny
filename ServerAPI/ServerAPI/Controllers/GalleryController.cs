namespace ServerAPI.Controllers
{
    using Microsoft.AspNetCore.Authentication.JwtBearer;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Cors;
    using Microsoft.AspNetCore.Http;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.EntityFrameworkCore;
    using ServerAPI.Data;
    using ServerAPI.Models;
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Threading.Tasks;

    [Route("/[controller]")]
    [EnableCors("AllowOrigin")]
    [ApiController]
    public class GalleryController : ControllerBase
    {
        private readonly JumpWithJennyDbContext _context;
        private readonly IWebHostEnvironment _env;

        public GalleryController(JumpWithJennyDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // DTO за Swagger (file upload)
        public class UploadImageRequest
        {
            [FromForm(Name = "file")]
            public IFormFile File { get; set; }
        }

        // GET: /gallery?page=1
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ImageModel>>> GetImages([FromQuery] int page = 1, [FromQuery] int pageSize = 4)
        {
            if (page < 1 || pageSize < 1)
                return BadRequest("Invalid page number or page size.");

            var images = await _context.Images
                .OrderByDescending(i => i.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(images);
        }

        // GET: /gallery/all
        [HttpGet("all")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult<IEnumerable<ImageModel>>> GetAllImages()
        {
            var images = await _context.Images
                .OrderByDescending(i => i.Id)
                .ToListAsync();

            return Ok(images);
        }

        // POST: /gallery/upload
        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult<ImageModel>> UploadImage([FromForm] UploadImageRequest request)
        {
            var file = request.File;
            if (file == null || file.Length == 0)
                return BadRequest("Не е качен файл.");

            var uploadsFolder = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
                await file.CopyToAsync(stream);

            var image = new ImageModel
            {
                Name = file.FileName,
                Url = $"/uploads/{fileName}",
                CreatedAt = DateTime.UtcNow
            };

            _context.Images.Add(image);
            await _context.SaveChangesAsync();

            return Ok(image);
        }

        // DELETE: /gallery/{id}
        [HttpDelete("{id}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> DeleteImage(int id)
        {
            var image = await _context.Images.FindAsync(id);
            if (image == null)
                return NotFound("Снимката не е намерена.");

            var filePath = Path.Combine(_env.WebRootPath ?? "wwwroot", image.Url.TrimStart('/'));
            if (System.IO.File.Exists(filePath))
                System.IO.File.Delete(filePath);

            _context.Images.Remove(image);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
