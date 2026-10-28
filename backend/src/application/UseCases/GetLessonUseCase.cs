using System.Net;
using application.Dtos;
using domain.Constants;
using domain.Interfaces.Repositories;
using domain.Interfaces.Services;

namespace application.UseCases
{
    public class GetLessonUseCase(ILessonRepository lessonRepository, ILessonService lessonService, IAnswerService answerService)
    {
        /// <summary>
        /// Busca uma aula pelo título e pelo nome da unidade, indicando se o usuário já a concluiu
        /// e quanto XP a aula vale para ele.
        /// </summary>
        /// <param name="unityName">Nome da unidade.</param>
        /// <param name="lessonName">Título da aula.</param>
        /// <param name="publicUserId">Id público do usuário autenticado.</param>
        /// <param name="includeInactive">Quando <c>true</c>, também encontra aulas de unidades inativas.</param>
        /// <returns>A aula, ou 404 quando ela não existe ou a unidade está inativa sem <paramref name="includeInactive"/>.</returns>
        public async Task<UseCaseResult<LessonResponseDto>> ExecuteAsync(string unityName, string lessonName, Guid publicUserId, bool includeInactive)
        {
            var lessonFromDb = await lessonRepository.GetLesson(unityName, lessonName, includeInactive);
            if (lessonFromDb is null) return new() { StatusCode = HttpStatusCode.NotFound };

            var lastAnswers = await answerService.GetLastAnswersAsync(publicUserId, lessonFromDb.PublicId);

            return new()
            {
                Content = new LessonResponseDto()
                {
                    PublicId = lessonFromDb.PublicId,
                    Description = lessonFromDb.Description,
                    Title = lessonFromDb.Title,
                    VideoUrl = lessonFromDb.VideoUrl,
                    Concluded = await lessonService.LessonAreAlreadyAnswered(publicUserId, lessonFromDb.PublicId),
                    AcceptsAnswers = lessonFromDb.Unity.IsActive,
                    CurrentPointsWeight = lastAnswers.CurrentPointsWeight,
                    MaxPointsWeight = LessonPoints.Max,
                    PointsLostPerWrongAnswer = LessonPoints.LostPerWrongAnswer,
                    MinPointsWeight = LessonPoints.Min,
                },
            };
        }
    }
}