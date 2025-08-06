namespace ServerAPI.Data
{
    using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
    using Microsoft.EntityFrameworkCore;
    using ServerAPI.Models;
    using System.Reflection;
    using System;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using ServerAPI.Models.Common;
    using Microsoft.AspNetCore.Identity;

    public class JumpWithJennyDbContext : IdentityDbContext<User, UserRole, string>
    {
        private static readonly MethodInfo SetIsDeletedQueryFilterMethod =
            typeof(JumpWithJennyDbContext).GetMethod(
                nameof(SetIsDeletedQueryFilter),
                BindingFlags.NonPublic | BindingFlags.Static);

        public JumpWithJennyDbContext(DbContextOptions<JumpWithJennyDbContext> options)
            : base(options)
        {
        }
        public DbSet<ImageModel> Images { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<Shoes> Shoes { get; set; }
        public DbSet<Workout> Workouts { get; set; }

        public DbSet<WorkoutCardType> WorkoutCardTypes { get; set; }

        public DbSet<UserHistory> UserHistories{ get; set; }

        public DbSet<WorkoutShoes> WorkoutShoes{ get; set; }

        public DbSet<RefreshToken> RefreshTokens { get; set; }


        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            this.ConfigureUserIdentityRelations(builder);

            var entityTypes = builder.Model.GetEntityTypes().ToList();
            // Set global query filter for not deleted entities only
            var deletableEntityTypes = entityTypes
                .Where(et => et.ClrType != null && typeof(IDeletableEntity).IsAssignableFrom(et.ClrType));
            foreach (var deletableEntityType in deletableEntityTypes)
            {
                var method = SetIsDeletedQueryFilterMethod.MakeGenericMethod(deletableEntityType.ClrType);
                method.Invoke(null, new object[] { builder });
            }

            // Disable Cascade Delete
            var foreignKeys = entityTypes
                .SelectMany(e => e.GetForeignKeys().Where(f => f.DeleteBehavior == DeleteBehavior.Cascade));

            builder
                .Entity<Appointment>()
                .HasKey(k => new { k.UserId, k.WorkoutId });

            builder.Entity<WorkoutShoes>()
                .HasKey(ws => new { ws.WorkoutId, ws.ShoeId }); // Composite primary key

            builder.Entity<WorkoutShoes>()
                .HasOne(ws => ws.Workout)
                .WithMany(w => w.WorkoutShoes)
                .HasForeignKey(ws => ws.WorkoutId);

            builder.Entity<WorkoutShoes>()
                .HasOne(ws => ws.Shoe)
                .WithMany(s => s.Workouts)
                .HasForeignKey(ws => ws.ShoeId);

            builder.Entity<IdentityUserRole<string>>(entity =>
            {
                entity.ToTable("UserRoles");
            });
        }

        public override int SaveChanges(bool acceptAllChangesOnSuccess)
        {
            this.ApplyAuditInfoRules();
            return base.SaveChanges(acceptAllChangesOnSuccess);
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
            this.SaveChangesAsync(true, cancellationToken);

        public override Task<int> SaveChangesAsync(
            bool acceptAllChangesOnSuccess,
            CancellationToken cancellationToken = default)
        {
            this.ApplyAuditInfoRules();
            return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
        }

        private static void SetIsDeletedQueryFilter<T>(ModelBuilder builder)
            where T : class, IDeletableEntity
        {
            builder.Entity<T>().HasQueryFilter(e => !e.IsDeleted);
        }

        // Applies configurations
        private void ConfigureUserIdentityRelations(ModelBuilder builder)
             => builder.ApplyConfigurationsFromAssembly(this.GetType().Assembly);

        private void ApplyAuditInfoRules()
        {
            var changedEntries = this.ChangeTracker
                .Entries()
                .Where(e =>
                    e.Entity is IAuditInfo &&
                    (e.State == EntityState.Added || e.State == EntityState.Modified));

            foreach (var entry in changedEntries)
            {
                var entity = (IAuditInfo)entry.Entity;
                if (entry.State == EntityState.Added && entity.CreatedOn == default)
                {
                    entity.CreatedOn = DateTime.UtcNow;
                }
                else
                {
                    entity.ModifiedOn = DateTime.UtcNow;
                }
            }
        }
    }
}
