using domain.Interfaces.Repositories;
using domain.Models;
using Microsoft.EntityFrameworkCore;

namespace infra.Repositories
{
    internal class LessonRepository(AppDbContext context) : BaseRepository<Lesson>(context), ILessonRepository
    {
        public async Task<Lesson?> GetLesson(Guid publicId)
        {
            return await context.Lessons
                .Include(l => l.Questions)
                .ThenInclude(q => q.Alternatives)
                .FirstOrDefaultAsync(l => l.PublicId == publicId);
        }

        public async Task<Lesson?> GetLesson(string unityName, string lessonName)
        {
            return await context.Lessons
                .Include(l => l.Questions)
                .ThenInclude(q => q.Alternatives)
                .FirstOrDefaultAsync(l => l.Title == lessonName && l.Unity.Name == unityName);
        }
    }
}