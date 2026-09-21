using System.Net;
using application.Dtos;
using domain.Dtos.Publics;
using domain.Dtos;
using domain.Interfaces.Repositories;
using domain.Interfaces.Services;

namespace application.UseCases
{
    public class VerifyAnswersUseCase(IUnityRepository unityRepository, ILessonService lessonService, IAnswerService answerService, IQuestionService questionService, ICertificateRepository _certificateRepository)
    {
        public async Task<UseCaseResult<GetLastAnswersResponse>> ExecuteAsync(Guid publicLessonId, string unityName, List<PublicAnswerDto> answers, Guid publicUserId)
        {
            var unity = await unityRepository.GetAsync(u => u.Name == unityName);
            if (unity is null)
            {
                return new()
                {
                    StatusCode = HttpStatusCode.BadRequest,
                    Content = new() { Message = "O nome da unidade está incorreto." }
                };
            }

            if (await lessonService.LessonAreAlreadyAnswered(publicUserId, publicLessonId))
            {
                return new()
                {
                    StatusCode = HttpStatusCode.BadRequest,
                    Content = new() { Message = "Todas as questões já foram respondidas" },
                };
            }

            var verifiedAnswers = await answerService.VerifyAnswersAsync(publicLessonId, unityName, answers, publicUserId, unity.PublicId);
            if (verifiedAnswers is null)
            {
                return new()
                {
                    StatusCode = HttpStatusCode.BadRequest,
                    Content = new() { Message = "Não foi possível encontrar uma das alternativas de alguma questão" },
                };
            }

            verifiedAnswers.WasLessonCorrectlyAnswered = !verifiedAnswers.Answers.Any(a => !a.IsCorrect);
            verifiedAnswers.WasUnityCorrectlyAnswered = await questionService.WasUnityCorrectlyAnswered(unity.PublicId, publicUserId);
            verifiedAnswers.WasCertificateAlreadyIssued = await _certificateRepository.GetAsync(c => c.User!.PublicId == publicUserId && c.Unity!.PublicId == unity.PublicId) is not null;

            return new()
            {
                Content = verifiedAnswers,
            };
        }
    }
}