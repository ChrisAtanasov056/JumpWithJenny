using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Newtonsoft.Json.Serialization;
using ServerAPI.Data;
using ServerAPI.Data.Common;
using ServerAPI.Data.Common.Repositories;
using ServerAPI.Data.Repositories;
using ServerAPI.Data.Seeding;
using ServerAPI.Models;
using ServerAPI.Models.Schedule;
using ServerAPI.Services;
using ServerAPI.Services.Mapper;
using ServerAPI.Services.Schedule;
using ServerAPI.Services.Users;
using System.Reflection;
using System.Text;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        builder.Logging.AddConsole(); // This enables console logging
        
        ConfigureServices(builder.Services, builder.Configuration);
        var app = builder.Build();
        Configure(app);
        app.Run();
    }

    private static void ConfigureServices(IServiceCollection services, IConfiguration configuration)
    {
        services.AddCors(c =>
            c.AddPolicy("AllowOrigin",
                option => option
                    .AllowAnyMethod()
                    .AllowAnyHeader()
                    .SetIsOriginAllowed(origin => true)
                    .AllowCredentials()));

        services.AddControllers()
            .AddNewtonsoftJson(options =>
                options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore)
            .AddNewtonsoftJson(option =>
                option.SerializerSettings.ContractResolver = new DefaultContractResolver());

        // Database context
        services.AddDbContext<JumpWithJennyDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DevConnection")));

        services.AddTransient<JwtTokenService>();

        // JWT configuration
        var jwtSection = configuration.GetSection("Jwt");
        services.Configure<JwtSettings>(jwtSection);
        var jwtSettings = jwtSection.Get<JwtSettings>();
        var key = Encoding.ASCII.GetBytes(jwtSettings.Secret);

        services.AddAuthentication(x =>
        {
            x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(x =>
        {
            x.RequireHttpsMetadata = false;
            x.SaveToken = true;
            x.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = false,
                ValidateAudience = false
            };
        });

        // Identity configuration
        services.AddIdentity<User, UserRole>(IdentityOptionsProvider.GetIdentityOptions)
            .AddRoles<UserRole>()
            .AddEntityFrameworkStores<JumpWithJennyDbContext>()
            .AddDefaultTokenProviders();

        services.AddHttpContextAccessor();
        services.Configure<IdentityOptions>(options =>
        {
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequireDigit = false;
            options.Password.RequireLowercase = false;
            options.Password.RequireUppercase = false;
            options.Password.RequiredLength = 5;
        });

        // Repositories
        services.AddScoped<IDbQueryRunner, DbQueryRunner>();
        services.AddScoped(typeof(IDeletableEntityRepository<>), typeof(EfDeletableEntityRepository<>));
        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));

        // App Services
        services.AddTransient<IScheduleService, ScheduleService>();
        services.AddTransient<IUserService, UserService>();

        // Logging and Swagger
        services.AddLogging();
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo { Title = "My API", Version = "v1" });
        });

        AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

        // Email Service Configuration
        services.AddSingleton<IEmailService, EmailService>(); // Register EmailService with DI

        // AutoMapper configuration
        services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
        AutoMapperConfig.RegisterMappings(AppDomain.CurrentDomain.GetAssemblies()); // Make sure this is invoked
    }

    private static void Configure(WebApplication app)
    {
        // Middleware configuration
        app.UseHttpsRedirection();
        app.UseStaticFiles();
        app.UseRouting();
        app.UseCors("AllowOrigin");
        app.UseAuthentication();
        app.UseAuthorization();

        if (app.Environment.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "Your API V1");
                c.RoutePrefix = "swagger";
            });
        }
        else
        {
            app.UseExceptionHandler("/Home/Error");
            app.UseStatusCodePagesWithReExecute("/Home/Error/{0}");
            app.UseHsts();
        }

        app.MapControllers();

        // Seed data on application startup
        using (var serviceScope = app.Services.CreateScope())
        {
            var dbContext = serviceScope.ServiceProvider.GetRequiredService<JumpWithJennyDbContext>();
            if (app.Environment.IsDevelopment())
            {
                dbContext.Database.Migrate();
            }

            new JumpWithJennyDbSeeder().SeedAsync(dbContext, serviceScope.ServiceProvider).GetAwaiter().GetResult();
        }
    }
}