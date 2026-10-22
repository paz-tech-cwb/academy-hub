using System.Net;
using application.Dtos;
using domain.Interfaces.Repositories;
using domain.Interfaces.Services;

namespace application.UseCases
{
    public class GetLessonsUseCase(IUnityRepository unityRepository, ILessonRepository lessonRepository, ILessonService lessonService)
    {
        /// <summary>
        /// Lista as aulas de uma unidade em ordem, indicando quais o usuário já concluiu.
        /// </summary>
        /// <param name="unityName">Nome da unidade.</param>
        /// <param name="publicUserId">Id público do usuário autenticado.</param>
        /// <param name="includeInactive">Quando <c>true</c>, também lista as aulas de unidades inativas.</param>
        /// <returns>As aulas, ou 404 quando a unidade não existe ou está inativa sem <paramref name="includeInactive"/>.</returns>
        public async Task<UseCaseResult<List<LessonResponseDto>>> ExecuteAsync(string unityName, Guid publicUserId, bool includeInactive)
        {
            var unity = await unityRepository.GetAsync(u => u.Name == unityName && (includeInactive || u.IsActive));
            if (unity is null) return new() { StatusCode = HttpStatusCode.NotFound };

            var dblessons = (await lessonRepository.GetListAsync(l => l.UnityId == unity.Id))
                .OrderBy(l => l.Sequence)
                .ToList();

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
                    AcceptsAnswers = unity.IsActive,
                });
            }

            return new()
            {
                Content = lessons,
            };
        }
    }
}