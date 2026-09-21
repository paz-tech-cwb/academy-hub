using System.Linq.Expressions;

namespace domain.Interfaces.Repositories
{
    public interface IBaseRepository<T>
    {
        public Task<T?> GetAsync(Expression<Func<T, bool>> filter);
        public Task<T> GetAsyncNotNull(Expression<Func<T, bool>> filter);
        public Task<List<T>> GetListAsync(Expression<Func<T, bool>> filter);
        public Task<T> InsertAsync(T entity);
        public Task InsertRangeAsync(List<T> entities);
        public Task UpdateAsync(T entity);
        public Task DeleteAsync(T entity);
        public Task DeleteRangeAsync(List<T> entities);
    }
}