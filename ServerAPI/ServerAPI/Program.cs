using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json.Serialization;
using ServerAPI.Data;
using ServerAPI.Data.Common;
using ServerAPI.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddCors(   c=>
            c.AddPolicy("AllowOrigin", 
            option =>option.AllowAnyOrigin()
                           .AllowAnyMethod()
                           .AllowAnyHeader())
);
builder.Services.AddSingleton(builder.Configuration);
builder.Services.AddDbContext<JumpWithJennyDbContext>(options =>
                options.UseSqlServer(
                    builder.Configuration.GetConnectionString("DevConnection")));

builder.Services.AddControllersWithViews()
        .AddNewtonsoftJson(options =>
            options.SerializerSettings.ReferenceLoopHandling= Newtonsoft.Json.ReferenceLoopHandling.Ignore)
        .AddNewtonsoftJson(option =>
            option.SerializerSettings.ContractResolver = new DefaultContractResolver());

builder.Services.AddIdentity<User, UserRole>
    (IdentityOptionsProvider.GetIdentityOptions)
    .AddRoles<UserRole>()
    .AddEntityFrameworkStores<JumpWithJennyDbContext>()
    .AddDefaultTokenProviders();
builder.Services.AddScoped<IDbQueryRunner, DbQueryRunner>();

builder.Services.AddMemoryCache();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
// Configure the HTTP request pipeline.
using (var serviceScope = app.Services.CreateScope())
{
    var dbContext = serviceScope.ServiceProvider.GetRequiredService<JumpWithJennyDbContext>();

    if (app.Environment.IsDevelopment())
    {
        dbContext.Database.Migrate();
    }

    //new FitForLifeDbContextSeeder().SeedAsync(dbContext, serviceScope.ServiceProvider).GetAwaiter().GetResult();
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
//app.UseAuthentication();
app.MapControllers();

app.Run();
