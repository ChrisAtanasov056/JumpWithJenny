namespace ServerAPI.Data
{
    using Microsoft.EntityFrameworkCore;
    using Microsoft.EntityFrameworkCore.Design;
    using Microsoft.Extensions.Configuration;
    using System.IO;

    class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<JumpWithJennyDbContext>
    {
        public JumpWithJennyDbContext CreateDbContext(string[] args)
        {
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .Build();

            var builder = new DbContextOptionsBuilder<JumpWithJennyDbContext>();
            var connectionString = configuration.GetConnectionString("DevConnection");
            builder.UseNpgsql(connectionString);

            return new JumpWithJennyDbContext(builder.Options);
        }
    }
}
