using System.Net;
using application.Dtos;
using domain.Interfaces.Repositories;

namespace application.UseCases
{
    public class ReorderLessonsUseCase(ILessonRepository lessonRepository)
    {
        public async Task<UseCaseResult<object>> ExecuteAsync(List<(Guid PublicId, int Sequence)> items)
        {
            var publicIds = items.Select(i => i.PublicId).ToList();
            if (publicIds.Distinct().Count() != items.Count)
                return new() { StatusCode = HttpStatusCode.BadRequest };

            var sequences = items.Select(i => i.Sequence).ToList();
            if (sequences.Distinct().Count() != items.Count)
                return new() { StatusCode = HttpStatusCode.BadRequest };

            var lessons = await lessonRepository.GetListAsync(l => publicIds.Contains(l.PublicId));
            if (lessons.Count != items.Count)
                return new() { StatusCode = HttpStatusCode.NotFound };

            foreach (var item in items)
            {
                var lesson = lessons.First(l => l.PublicId == item.PublicId);
                lesson.Sequence = item.Sequence;
                await lessonRepository.UpdateAsync(lesson);
            }

            return new();
        }
    }
}