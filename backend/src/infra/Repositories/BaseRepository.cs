using domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Data;
using System.Linq.Expressions;

namespace infra.Repositories
{
    internal class BaseRepository<T>(DbContext context) : IBaseRepository<T> where T : class
    {
        protected readonly DbContext _context = context;
        protected readonly DbSet<T> _dbSet = context.Set<T>();

        public async Task<T> GetAsyncNotNull(Expression<Func<T, bool>> filter)
        {
            var entity = await _dbSet.FirstOrDefaultAsync(filter)
            ?? throw new InvalidOperationException($"Entity not found: {nameof(T)}");

            return entity;
        }

        public virtual async Task<T?> GetAsync(Expression<Func<T, bool>> filter)
        {
            return await _dbSet.FirstOrDefaultAsync(filter);
        }

        public async Task<List<T>> GetListAsync(Expression<Func<T, bool>> filter)
        {
            return await _dbSet.Where(filter).ToListAsync();
        }

        public async Task<T> InsertAsync(T entity)
        {
            await _dbSet.AddAsync(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task InsertRangeAsync(List<T> entities)
        {
            await _dbSet.AddRangeAsync(entities);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(T entity)
        {
            _dbSet.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(T entity)
        {
            _dbSet.Remove(entity);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteRangeAsync(List<T> entities)
        {
            _dbSet.RemoveRange(entities);
            await _context.SaveChangesAsync();
        }
    }
}
