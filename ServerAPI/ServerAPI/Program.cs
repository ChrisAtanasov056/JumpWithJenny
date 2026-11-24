using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
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
using ServerAPI.Services.Schedule;
using ServerAPI.Services.Users;
using ServerAPI.Services.Workouts;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Threading.RateLimiting;

public partial class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        builder.Logging.AddConsole(); // This enables console logg
        ConfigureServices(builder.Services, builder.Configuration, builder.Environment);
        var app = builder.Build();
        Configure(app);
        app.Run();
    }

    private static void ConfigureServices(IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment)
    {
        var configuredOrigins = configuration.GetSection("AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
        var allowedOrigins = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "https://jumpwithjenny.com",
            "https://www.jumpwithjenny.com"
        };

        foreach (var origin in configuredOrigins)
        {
            if (!string.IsNullOrWhiteSpace(origin))
            {
                allowedOrigins.Add(origin.Trim());
            }
        }

        if (environment.IsDevelopment())
        {
            allowedOrigins.Add("http://localhost:3000");
            allowedOrigins.Add("https://localhost:3000");
            allowedOrigins.Add("https://localhost:5001");
            allowedOrigins.Add("http://localhost:5173");
        }

        services.AddCors(options =>
        {
            options.AddPolicy("AllowOrigin", builder =>
            {
                builder
                    .WithOrigins(allowedOrigins.ToArray())
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        });

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = async (context, cancellationToken) =>
            {
                context.HttpContext.Response.ContentType = "application/json";
                await context.HttpContext.Response.WriteAsync(
                    "{\"error\":\"Too many requests. Please try again later.\"}",
                    cancellationToken);
            };

            options.AddPolicy("AuthPolicy", httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 15,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0
                    }));

            options.AddPolicy("EmailPolicy", httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 5,
                        Window = TimeSpan.FromMinutes(5),
                        QueueLimit = 0
                    }));
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

        // Identity configuration (must precede AddAuthentication so JWT remains the default scheme)
        services.AddIdentity<User, UserRole>(IdentityOptionsProvider.GetIdentityOptions)
            .AddRoles<UserRole>()
            .AddEntityFrameworkStores<JumpWithJennyDbContext>()
            .AddDefaultTokenProviders();

        services.AddHttpContextAccessor();

        var jwtSection = configuration.GetSection("Jwt");
        services.Configure<JwtSettings>(jwtSection);
        var jwtSettings = jwtSection.Get<JwtSettings>();
        if (jwtSettings == null || string.IsNullOrWhiteSpace(jwtSettings.Secret))
        {
            throw new InvalidOperationException("Jwt:Secret configuration value is missing.");
        }

        var key = Encoding.UTF8.GetBytes(jwtSettings.Secret);

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme; 
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = true; // Винаги true за продукция, false за локално
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
                    var logger = context.HttpContext.RequestServices
                        .GetRequiredService<ILogger<Program>>();
                    logger.LogError(context.Exception, "❌ Authentication failed");
                    return Task.CompletedTask;
                },
                OnTokenValidated = context =>
                {
                    var logger = context.HttpContext.RequestServices
                        .GetRequiredService<ILogger<Program>>();
                    logger.LogInformation("✅ Token validated for user {User}",
                        context.Principal.Identity?.Name ?? "Unknown");
                    return Task.CompletedTask;
                },
                OnChallenge = context =>
                {
                    var logger = context.HttpContext.RequestServices
                        .GetRequiredService<ILogger<Program>>();
                    logger.LogWarning("⚠️ JWT challenge: {Error} - {Description}",
                        context.Error, context.ErrorDescription);
                    return Task.CompletedTask;
                }
            };
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
        services.AddHttpClient<IFacebookAuthService, FacebookAuthService>();
        services.AddScoped<IShoesService, ShoesService>();

        // Logging and Swagger
        services.AddLogging();
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo { Title = "My API", Version = "v1" });
        });
        AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);


        services.ConfigureApplicationCookie(options =>
        {
            options.Events.OnRedirectToLogin = context =>
            {
                context.Response.StatusCode = 401;
                return Task.CompletedTask;
            };
            options.Events.OnRedirectToAccessDenied = context =>
            {
                context.Response.StatusCode = 403;
                return Task.CompletedTask;
            };
        });
    }

    private static void Configure(WebApplication app)
    {
        app.UseForwardedHeaders();

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

            app.UseHsts();
        }

        // Security headers before UseStaticFiles so uploaded static files also receive CSP and nosniff
        if (!app.Environment.IsDevelopment())
        {
            app.UseMiddleware<CspNonceMiddleware>();
        }

        app.Use(async (context, next) =>
        {
            context.Response.Headers.Append("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
            await next();
        });

        app.UseHttpsRedirection();
        app.UseStaticFiles();

        app.UseRouting();
        app.UseCors("AllowOrigin");
        app.UseRateLimiter();

        app.UseAuthentication();
        app.UseAuthorization();

        app.MapGet("/", () => Results.Ok(new { message = "JumpWithJenny API is running ✅" }));

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