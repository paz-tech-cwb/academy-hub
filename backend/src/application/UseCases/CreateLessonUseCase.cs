using System.Net;
using application.Dtos;
using domain.Interfaces.Repositories;
using domain.Models;

namespace application.UseCases
{
    public class CreateLessonUseCase(
        IUnityRepository unityRepository,
        ILessonRepository lessonRepository)
    {
        public async Task<UseCaseResult<Lesson>> ExecuteAsync(Guid unityPublicId, string title, string? description, int sequence, string? videoUrl)
        {
            var unity = await unityRepository.GetAsync(u => u.PublicId == unityPublicId);
            if (unity is null)
                return new() { StatusCode = HttpStatusCode.NotFound };

            var titleExists = await lessonRepository.GetAsync(l => l.Title == title);
            if (titleExists is not null)
                return new() { StatusCode = HttpStatusCode.BadRequest };

            var lesson = new Lesson
            {
                Title = title,
                Description = description,
                Sequence = sequence,
                VideoUrl = string.IsNullOrWhiteSpace(videoUrl) ? "" : videoUrl,
                UnityId = unity.Id,
                Unity = unity
            };

            var created = await lessonRepository.InsertAsync(lesson);
            return new() { Content = created, StatusCode = HttpStatusCode.Created };
        }
    }
}