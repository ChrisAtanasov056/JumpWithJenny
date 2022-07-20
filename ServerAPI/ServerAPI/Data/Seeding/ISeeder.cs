namespace ServerAPI.Data.Seeding
{
    using System;
    using System.Threading.Tasks;

    public interface ISeeder
    {
        Task SeedAsync(JumpWithJennyDbContext dbContext, IServiceProvider serviceProvider);
    }
}