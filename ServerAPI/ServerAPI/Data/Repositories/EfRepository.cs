namespace ServerAPI.Data.Repositories
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Microsoft.EntityFrameworkCore;
    using ServerAPI.Data.Common.Repositories;

    public class EfRepository<TEntity> : IRepository<TEntity>
        where TEntity : class
    {
        public EfRepository(JumpWithJennyDbContext context)
        {
            this.Context = context ?? throw new ArgumentNullException(nameof(context));
            this.DbSet = this.Context.Set<TEntity>();
        }

        protected DbSet<TEntity> DbSet { get; set; }

        protected JumpWithJennyDbContext Context { get; set; }

        public virtual IQueryable<TEntity> All() => this.DbSet;

        public virtual IQueryable<TEntity> AllAsNoTracking() => this.DbSet.AsNoTracking();

        public virtual IQueryable<TEntity> AllAsSplitQuery() => this.DbSet.AsSplitQuery();

        public virtual IQueryable<TEntity> AllAsNoTrackingSplitQuery() => this.DbSet.AsNoTracking().AsSplitQuery();

        public virtual Task AddAsync(TEntity entity, CancellationToken cancellationToken = default) =>
            this.DbSet.AddAsync(entity, cancellationToken).AsTask();

        public virtual Task AddRangeAsync(IEnumerable<TEntity> entities, CancellationToken cancellationToken = default) =>
            this.DbSet.AddRangeAsync(entities, cancellationToken);

        public virtual void Update(TEntity entity)
        {
            var entry = this.Context.Entry(entity);
            if (entry.State == EntityState.Detached)
            {
                this.DbSet.Attach(entity);
            }

            entry.State = EntityState.Modified;
        }

        public virtual void Delete(TEntity entity) => this.DbSet.Remove(entity);

        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
            this.Context.SaveChangesAsync(cancellationToken);

        public void Dispose()
        {
            this.Dispose(true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool disposing)
        {
            // DbContext is managed and disposed by the scoped DI container.
        }
    }
}
