using System.Net;
using application.Dtos;
using domain.Interfaces.Repositories;
using domain.Interfaces.Services;

namespace application.UseCases
{
    public class GetLessonUseCase(ILessonRepository lessonRepository, ILessonService lessonService)
    {
        public async Task<UseCaseResult<LessonResponseDto>> ExecuteAsync(string unityName, string lessonName, Guid publicUserId)
        {
            var lessonFromDb = await lessonRepository.GetLesson(unityName, lessonName);
            if (lessonFromDb is null) return new() { StatusCode = HttpStatusCode.NoContent };

            return new()
            {
                Content = new LessonResponseDto()
                {
                    PublicId = lessonFromDb.PublicId,
                    Description = lessonFromDb.Description,
                    Title = lessonFromDb.Title,
                    VideoUrl = lessonFromDb.VideoUrl,
                    Concluded = await lessonService.LessonAreAlreadyAnswered(publicUserId, lessonFromDb.PublicId),
                },
            };
        }
    }
}