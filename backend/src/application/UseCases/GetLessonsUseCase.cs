using application.Dtos;
using domain.Interfaces.Repositories;
using domain.Interfaces.Services;

namespace application.UseCases
{
    public class GetLessonsUseCase(IUnityRepository unityRepository, ILessonRepository lessonRepository, ILessonService lessonService)
    {
        public async Task<UseCaseResult<List<LessonResponseDto>>> ExecuteAsync(string unityName, Guid publicUserId)
        {
            var unity = await unityRepository.GetAsync(u => u.Name == unityName);
            if (unity is null) return new() { Content = [] };

            var dblessons = await lessonRepository.GetListAsync(l => l.UnityId == unity.Id);

            var lessons = new List<LessonResponseDto>();

            foreach (var lesson in dblessons)
            {
                lessons.Add(new LessonResponseDto
                {
                    PublicId = lesson.PublicId,
                    Title = lesson.Title,
                    Description = lesson.Description,
                    VideoUrl = lesson.VideoUrl,
                    Sequence = lesson.Sequence,
                    Concluded = await lessonService.LessonAreAlreadyAnswered(publicUserId, lesson.PublicId),
                });
            }

            return new()
            {
                Content = lessons,
            };
        }
    }
}