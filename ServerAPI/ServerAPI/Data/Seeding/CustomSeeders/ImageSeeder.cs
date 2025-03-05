namespace ServerAPI.Data.Seeding.CustomSeeders
{
    using System;
    using System.IO;
    using System.Linq;
    using System.Threading.Tasks;
    using Microsoft.Extensions.DependencyInjection;
    using Microsoft.Extensions.Hosting; // Add this namespace
    using ServerAPI.Models;

    public class ImageSeeder : ISeeder
    {
        public async Task SeedAsync(JumpWithJennyDbContext dbContext, IServiceProvider serviceProvider)
        {
            var hostEnvironment = serviceProvider.GetRequiredService<IHostEnvironment>();
            var imageFolderPath = Path.Combine(hostEnvironment.ContentRootPath, "wwwroot", "Images");
            var seedImagesSourcePath = Path.Combine(hostEnvironment.ContentRootPath, "SeedData", "Images");

            // Log paths for debugging
            Console.WriteLine($"Content Root Path: {hostEnvironment.ContentRootPath}");
            Console.WriteLine($"Image Folder Path: {imageFolderPath}");
            Console.WriteLine($"Seed Images Source Path: {seedImagesSourcePath}");

            // Ensure the Images folder exists
            if (!Directory.Exists(imageFolderPath))
            {
                Console.WriteLine("Creating Images folder...");
                Directory.CreateDirectory(imageFolderPath);
            }

            // Copy default images to the Images folder if the source exists
            if (Directory.Exists(seedImagesSourcePath))
            {
                Console.WriteLine($"Found {Directory.GetFiles(seedImagesSourcePath).Length} files in SeedData/Images.");
                foreach (var sourceFilePath in Directory.GetFiles(seedImagesSourcePath))
                {
                    var fileName = Path.GetFileName(sourceFilePath);
                    var destFilePath = Path.Combine(imageFolderPath, fileName);
                    
                    Console.WriteLine($"Copying {fileName} to {destFilePath}");
                    if (!File.Exists(destFilePath))
                    {
                        File.Copy(sourceFilePath, destFilePath);
                    }
                }
            }
            else
            {
                Console.WriteLine("SeedData/Images folder not found.");
            }

            // Only seed if no images exist in the database
            if (!dbContext.Images.Any())
            {
                var imageFiles = Directory.GetFiles(imageFolderPath);
                Console.WriteLine($"Found {imageFiles.Length} images in {imageFolderPath}.");

                foreach (var imagePath in imageFiles)
                {
                    var fileName = Path.GetFileName(imagePath);
                    Console.WriteLine($"Seeding image: {fileName}");

                    var image = new ImageModel
                    {
                        Name = fileName,
                        Url = $"/Images/{fileName}",
                        CreatedAt = DateTime.UtcNow
                    };

                    await dbContext.Images.AddAsync(image);
                }

                await dbContext.SaveChangesAsync();
                Console.WriteLine("Images seeded successfully.");
            }
            else
            {
                Console.WriteLine("Database already contains images. Skipping seeding.");
            }
        }
    }
}