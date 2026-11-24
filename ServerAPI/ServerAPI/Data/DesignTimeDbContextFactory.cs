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
            AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .AddEnvironmentVariables()
                .Build();

            var builder = new DbContextOptionsBuilder<JumpWithJennyDbContext>();
            var connectionString = configuration.GetConnectionString("DevConnection");
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                connectionString = "Host=localhost;Database=jumpwithjenny;Username=postgres;Password=postgres";
            }

            builder.UseNpgsql(connectionString);

            return new JumpWithJennyDbContext(builder.Options);
        }
    }
}
