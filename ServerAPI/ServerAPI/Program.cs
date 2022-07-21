using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json.Serialization;
using ServerAPI.Data;
using ServerAPI.Data.Common;
using ServerAPI.Data.Common.Repositories;
using ServerAPI.Data.Repositories;
using ServerAPI.Data.Seeding;
using ServerAPI.Models;
using ServerAPI.Services.Mapper;
using ServerAPI.Services.Schedule;
using System.Reflection;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
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
                  .SetIsOriginAllowed(origin => true) // allow any origin
                  .AllowCredentials()) // allow credentials
    );
        services.AddControllers();

        services.AddSingleton(configuration);
        services.AddDbContext<JumpWithJennyDbContext>(options =>
                        options.UseSqlServer(
                            configuration.GetConnectionString("DevConnection")));

        services.AddControllersWithViews()
                .AddNewtonsoftJson(options =>
                    options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore)
                .AddNewtonsoftJson(option =>
                    option.SerializerSettings.ContractResolver = new DefaultContractResolver());


        services.AddIdentity<User, UserRole>
            (IdentityOptionsProvider.GetIdentityOptions)
            .AddRoles<UserRole>()
            .AddEntityFrameworkStores<JumpWithJennyDbContext>()
            .AddDefaultTokenProviders();
        services.Configure<IdentityOptions>(options =>
        {
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequireDigit = false;
            options.Password.RequireLowercase = false;
            options.Password.RequireUppercase = false;
            options.Password.RequiredLength = 5;
        });
        services.AddScoped<IDbQueryRunner, DbQueryRunner>();
        services.AddScoped(typeof(IDeletableEntityRepository<>), typeof(EfDeletableEntityRepository<>));
        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        services.AddMemoryCache();

        //App Services
        services.AddTransient<IScheduleService, ScheduleService>();

        // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();
        services.AddLogging();
        services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
    }
    
   private static void Configure(WebApplication app)
    {
        AutoMapperConfig.RegisterMappings(typeof(User).GetTypeInfo().Assembly);
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
        if (app.Environment.IsDevelopment())
        {

            app.UseDeveloperExceptionPage();
        }
        else
        {
            //app.UseExceptionHandler("/Home/Error");
            //app.UseStatusCodePagesWithReExecute("/Home/Error/{0}");
            // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
            //app.UseHsts();
        }
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }
        app.UseCors(option => option.AllowAnyOrigin()
                                   .AllowAnyMethod()
                                   .AllowAnyHeader());
        app.UseHttpsRedirection();
        app.UseStaticFiles();
        app.UseAuthorization();
        app.UseAuthentication();
        app.MapControllers();
        app.Run();
    }
}

// Configure the HTTP request pipeline.

