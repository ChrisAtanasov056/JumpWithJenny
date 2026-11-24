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

            var environmentName = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
                ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT");

            var configurationBuilder = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: false);

            if (!string.IsNullOrWhiteSpace(environmentName))
            {
                configurationBuilder.AddJsonFile($"appsettings.{environmentName}.json", optional: true, reloadOnChange: false);
            }

            var configuration = configurationBuilder
                .AddEnvironmentVariables()
                .Build();

            var builder = new DbContextOptionsBuilder<JumpWithJennyDbContext>();
            var connectionString = configuration.GetConnectionString("DevConnection");
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                if (string.Equals(environmentName, "Production", StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException("ConnectionStrings:DevConnection is missing in Production environment.");
                }

                connectionString = "Host=localhost;Database=jumpwithjenny;Username=postgres;Password=postgres";
            }

            builder.UseNpgsql(connectionString);

            return new JumpWithJennyDbContext(builder.Options);
        }
    }
}
