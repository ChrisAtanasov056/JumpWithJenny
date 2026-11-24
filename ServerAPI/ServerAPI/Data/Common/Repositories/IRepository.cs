namespace ServerAPI.Data.Common.Repositories
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;

    public interface IRepository<TEntity> : IDisposable
        where TEntity : class
    {
        IQueryable<TEntity> All();

        IQueryable<TEntity> AllAsNoTracking();

        IQueryable<TEntity> AllAsSplitQuery();

        IQueryable<TEntity> AllAsNoTrackingSplitQuery();

        Task AddAsync(TEntity entity, CancellationToken cancellationToken = default);

        Task AddRangeAsync(IEnumerable<TEntity> entities, CancellationToken cancellationToken = default);

        void Update(TEntity entity);

        /// <summary>
        /// Deletes the specified entity from the repository.
        /// </summary>
        /// <param name="entity">The entity to be deleted.</param>
        void Delete(TEntity entity);

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
