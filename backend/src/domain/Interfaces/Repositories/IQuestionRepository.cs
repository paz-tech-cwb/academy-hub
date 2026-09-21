using domain.Models;

namespace domain.Interfaces.Repositories
{
    public interface IQuestionRepository : IBaseRepository<Question>
    {
        public Task<IEnumerable<Question>> GetListAsync(int lessonId);
    }
}
