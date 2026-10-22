using System.Net;
using application.Dtos;
using domain.Dtos.Publics;
using domain.Dtos;
using domain.Interfaces.Repositories;
using domain.Interfaces.Services;

namespace application.UseCases
{
    public class VerifyAnswersUseCase(IUnityRepository unityRepository, ILessonRepository lessonRepository, IQuestionRepository questionRepository, ILessonService lessonService, IAnswerService answerService, IQuestionService questionService, ICertificateRepository _certificateRepository)
    {
        /// <summary>
        /// Corrige e grava as respostas do usuário para as questões de uma aula.
        /// </summary>
        /// <param name="publicLessonId">Id público da aula respondida.</param>
        /// <param name="unityName">Nome da unidade da aula.</param>
        /// <param name="answers">Alternativas escolhidas pelo usuário.</param>
        /// <param name="publicUserId">Id público do usuário autenticado.</param>
        /// <param name="canSeeInactive">Indica se o usuário pode ver unidades inativas. Só muda a resposta de recusa: unidades inativas nunca aceitam respostas.</param>
        /// <returns>O resultado da correção; 404 quando a unidade ou a aula não é encontrada; 400 quando as respostas são inválidas ou a unidade está inativa.</returns>
        public async Task<UseCaseResult<GetLastAnswersResponse>> ExecuteAsync(Guid publicLessonId, string unityName, List<PublicAnswerDto> answers, Guid publicUserId, bool canSeeInactive)
        {
            var unity = await unityRepository.GetAsync(u => u.Name == unityName);
            if (unity is null || (!unity.IsActive && !canSeeInactive))
            {
                return new()
                {
                    StatusCode = HttpStatusCode.NotFound,
                    Content = new() { Message = "Unidade não encontrada." }
                };
            }

            if (!unity.IsActive)
            {
                return new()
                {
                    StatusCode = HttpStatusCode.BadRequest,
                    Content = new() { Message = "Unidades inativas não aceitam respostas." }
                };
            }

            var lesson = await lessonRepository.GetAsync(l => l.PublicId == publicLessonId && l.UnityId == unity.Id);
            if (lesson is null)
            {
                return new()
                {
                    StatusCode = HttpStatusCode.NotFound,
                    Content = new() { Message = "Aula não encontrada." }
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

            if (!await AllAlternativesBelongToLesson(answers, lesson.Id))
            {
                return new()
                {
                    StatusCode = HttpStatusCode.BadRequest,
                    Content = new() { Message = "Alguma das alternativas respondidas não pertence a esta aula." },
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

        /// <summary>
        /// Verifica se todas as alternativas respondidas são de questões da aula informada.
        /// </summary>
        /// <param name="answers">Alternativas escolhidas pelo usuário.</param>
        /// <param name="lessonId">Id interno da aula.</param>
        /// <returns><c>true</c> quando todas as alternativas pertencem à aula.</returns>
        private async Task<bool> AllAlternativesBelongToLesson(List<PublicAnswerDto> answers, int lessonId)
        {
            var lessonAlternativeIds = (await questionRepository.GetListAsync(lessonId))
                .SelectMany(q => q.Alternatives)
                .Select(a => a.PublicId)
                .ToHashSet();

            return answers.All(a => lessonAlternativeIds.Contains(a.PublicAlternativeId));
        }
    }
}
