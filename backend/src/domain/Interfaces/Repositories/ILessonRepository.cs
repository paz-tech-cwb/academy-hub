using domain.Models;

namespace domain.Interfaces.Repositories
{
    public interface ILessonRepository : IBaseRepository<Lesson>
    {
        public Task<Lesson?> GetLesson(Guid publicId);
        public Task<Lesson?> GetLesson(string unityName, string publicId);
    }
}