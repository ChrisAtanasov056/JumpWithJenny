namespace ServerAPI.Controllers
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Cors;
    using Microsoft.AspNetCore.Http;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.EntityFrameworkCore;
    using ServerAPI.Common;
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

        private const long MaxFileSizeBytes = 10 * 1024 * 1024;
        private const int MaxPageSize = 50;

        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".webp"
        };

        private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg", "image/png", "image/webp"
        };

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
            if (page < 1 || pageSize < 1 || pageSize > MaxPageSize)
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
        [Authorize(Roles = GlobalConstants.AdministratorRoleName)]
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
        [RequestSizeLimit(MaxFileSizeBytes)]
        [Authorize(Roles = GlobalConstants.AdministratorRoleName)]
        public async Task<ActionResult<ImageModel>> UploadImage([FromForm] UploadImageRequest request)
        {
            var file = request?.File;
            if (file == null || file.Length == 0)
                return BadRequest("Не е качен файл.");

            if (file.Length > MaxFileSizeBytes)
                return BadRequest("Файлът надвишава максималния размер от 10 MB.");

            var extension = Path.GetExtension(file.FileName)?.ToLowerInvariant();
            if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
                return BadRequest("Невалиден формат на файла. Позволени са само .jpg, .jpeg, .png и .webp.");

            if (string.IsNullOrWhiteSpace(file.ContentType) || !AllowedMimeTypes.Contains(file.ContentType))
                return BadRequest("Невалиден тип на файла.");

            using var inputStream = file.OpenReadStream();
            if (!await IsValidImageSignatureAsync(inputStream, extension))
                return BadRequest("Невалиден или повреден файл с изображение.");

            var uploadsFolder = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var fileName = Guid.NewGuid().ToString() + extension;
            var filePath = Path.Combine(uploadsFolder, fileName);

            inputStream.Position = 0;
            using (var stream = new FileStream(filePath, FileMode.Create))
                await inputStream.CopyToAsync(stream);

            var safeOriginalName = Path.GetFileName(file.FileName) ?? fileName;
            if (safeOriginalName.Length > 255)
                safeOriginalName = safeOriginalName.Substring(0, 255);

            var image = new ImageModel
            {
                Name = safeOriginalName,
                Url = $"/uploads/{fileName}",
                CreatedAt = DateTime.UtcNow
            };

            _context.Images.Add(image);
            await _context.SaveChangesAsync();

            return Ok(image);
        }

        // DELETE: /gallery/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = GlobalConstants.AdministratorRoleName)]
        public async Task<IActionResult> DeleteImage(int id)
        {
            var image = await _context.Images.FindAsync(id);
            if (image == null)
                return NotFound("Снимката не е намерена.");

            if (!string.IsNullOrWhiteSpace(image.Url))
            {
                var webRootFullPath = Path.GetFullPath(_env.WebRootPath ?? "wwwroot");
                var normalizedRoot = webRootFullPath.TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
                var fileFullPath = Path.GetFullPath(Path.Combine(webRootFullPath, image.Url.TrimStart('/', '\\')));

                if (fileFullPath.StartsWith(normalizedRoot, StringComparison.Ordinal) && System.IO.File.Exists(fileFullPath))
                    System.IO.File.Delete(fileFullPath);
            }

            _context.Images.Remove(image);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private static async Task<bool> IsValidImageSignatureAsync(Stream stream, string extension)
        {
            var header = new byte[12];
            var totalRead = 0;
            while (totalRead < header.Length)
            {
                var read = await stream.ReadAsync(header, totalRead, header.Length - totalRead);
                if (read == 0)
                    break;
                totalRead += read;
            }

            return extension switch
            {
                ".jpg" or ".jpeg" => totalRead >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF,
                ".png" => totalRead >= 8
                          && header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47
                          && header[4] == 0x0D && header[5] == 0x0A && header[6] == 0x1A && header[7] == 0x0A,
                ".webp" => totalRead >= 12
                           && header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46
                           && header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50,
                _ => false
            };
        }
    }
}
