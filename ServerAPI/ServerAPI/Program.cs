using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Newtonsoft.Json.Serialization;
using ServerAPI.Data;
using ServerAPI.Data.Common;
using ServerAPI.Data.Common.Repositories;
using ServerAPI.Data.Repositories;
using ServerAPI.Data.Seeding;
using ServerAPI.Models;
using ServerAPI.Services;
using ServerAPI.Services.AuthService;
using ServerAPI.Services.Contacts;
using ServerAPI.Services.Mapper;
using ServerAPI.Services.Schedule;
using ServerAPI.Services.Users;
using ServerAPI.Services.Workouts;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

public partial class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        builder.Logging.AddConsole(); // This enables console logg
        ConfigureServices(builder.Services, builder.Configuration);
        var app = builder.Build();
        Configure(app);
        app.Run();
    }

    private static void ConfigureServices(IServiceCollection services, IConfiguration configuration)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("AllowOrigin", builder =>
            {
                builder
                    .WithOrigins("http://localhost:3000", "https://localhost:3000", "https://localhost:5001", "https://jumpwithjenny.com") 
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials(); 
            });
        });

        services.AddSingleton<IConfiguration>(configuration);


        services.AddControllers()
            .AddNewtonsoftJson(options =>
            {
                options.SerializerSettings.ContractResolver = new DefaultContractResolver();
                options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
            });

        // Database context
        services.AddDbContext<JumpWithJennyDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DevConnection")));

        services.AddTransient<JwtTokenService>();

       var jwtSection = configuration.GetSection("Jwt");
        services.Configure<JwtSettings>(jwtSection);
        var jwtSettings = jwtSection.Get<JwtSettings>();
        var key = Encoding.ASCII.GetBytes(jwtSettings.Secret);

        services.AddAuthentication(options =>
        {
            // Задаваме JWT като основна схема за аутентикация
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;  // това помага понякога да няма конфликт
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false; // Винаги true за продукция, false за локално
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings.Issuer,
                ValidAudience = jwtSettings.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                RoleClaimType = ClaimTypes.Role,
                NameClaimType = ClaimTypes.Name
            };

            options.Events = new JwtBearerEvents
            {
                OnAuthenticationFailed = context =>
                {
                    Console.WriteLine("❌ Authentication failed: " + context.Exception);
                    var logger = context.HttpContext.RequestServices
                        .GetRequiredService<ILogger<Program>>();
                    logger.LogError(context.Exception, "❌ Authentication failed");
                    return Task.CompletedTask;
                },
                OnTokenValidated = context =>
                {
                    Console.WriteLine("✅ Token validated for user: " +
                        (context.Principal.Identity?.Name ?? "Unknown"));
                    var logger = context.HttpContext.RequestServices
                        .GetRequiredService<ILogger<Program>>();
                    logger.LogInformation("✅ Token validated for user {User}",
                        context.Principal.Identity?.Name ?? "Unknown");
                    return Task.CompletedTask;
                },
                OnChallenge = context =>
                {
                    Console.WriteLine($"⚠️ JWT challenge: {context.Error} - {context.ErrorDescription}");
                    var logger = context.HttpContext.RequestServices
                        .GetRequiredService<ILogger<Program>>();
                    logger.LogWarning("⚠️ JWT challenge: {Error} - {Description}",
                        context.Error, context.ErrorDescription);
                    return Task.CompletedTask;
                }
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
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IWorkoutServices, WorkoutServices>();
        services.AddHttpClient<IGoogleAuthService, GoogleAuthService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IEmailTemplateService, EmailTemplateService>();
        services.AddScoped<IContactService, ContactService>();
        services.AddScoped<IFacebookAuthService, FacebookAuthService>();
        services.AddScoped<IShoesService, ShoesService>();

        // Logging and Swagger
        services.AddLogging();
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo { Title = "My API", Version = "v1" });
        });
        AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

        // Email Service Configuration
        services.AddScoped<IEmailTemplateService, EmailTemplateService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IContactService, ContactService>();
        services.AddScoped<IGoogleAuthService, GoogleAuthService>();


        // AutoMapper configuration
        services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
        AutoMapperConfig.RegisterMappings(AppDomain.CurrentDomain.GetAssemblies()); // Make sure this is invoked

        services.ConfigureApplicationCookie(options =>
        {
            options.Events.OnRedirectToLogin = context =>
            {
                context.Response.StatusCode = 401;
                return Task.CompletedTask;
            };
        });
    }

    private static void Configure(WebApplication app)
    {
        // Middleware configuration
        app.UseHttpsRedirection();
        app.UseStaticFiles();

        // Добавяме CSP само в Production, за да не пречи на Swagger
        if (!app.Environment.IsDevelopment())
        {
            app.UseMiddleware<CspNonceMiddleware>();
        }

        app.UseRouting();
        app.UseCors("AllowOrigin");

        app.Use(async (context, next) =>
        {
            context.Response.Headers.Append("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
            await next();
        });

        app.UseAuthentication();
        app.UseAuthorization();

        if (app.Environment.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();

            // 🔓 Премахваме CSP за Swagger, ако все пак middleware е включен
            app.Use(async (context, next) =>
            {
                if (context.Request.Path.StartsWithSegments("/swagger"))
                {
                    context.Response.Headers.Remove("Content-Security-Policy");
                }
                await next();
            });

            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "Your API V1");
                c.RoutePrefix = "swagger";
            });
        }
        else
        {
            app.UseStatusCodePagesWithReExecute("/Home/Error/{0}");
            app.UseHsts();

            app.UseExceptionHandler(errorApp =>
            {
                errorApp.Run(async context =>
                {
                    var exceptionHandlerPathFeature = context.Features.Get<IExceptionHandlerPathFeature>();
                    var exception = exceptionHandlerPathFeature?.Error;

                    var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
                    logger.LogError(exception, "Unhandled exception");

                    context.Response.StatusCode = 500;
                    context.Response.ContentType = "application/json";

                    var result = JsonSerializer.Serialize(new { error = "Internal Server Error" });
                    await context.Response.WriteAsync(result);
                });
            });
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

            new JumpWithJennyDbSeeder()
                .SeedAsync(dbContext, serviceScope.ServiceProvider)
                .GetAwaiter()
                .GetResult();
        }
    }

}