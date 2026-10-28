using System.Net;
using application.Dtos;
using domain.Interfaces.Repositories;
using domain.Models;

namespace application.UseCases
{
    public class GetMyProgressUseCase(
        IUserRepository userRepository,
        IUnityRepository unityRepository,
        ILessonRepository lessonRepository,
        IAnswerRepository answerRepository)
    {
        /// <summary>
        /// Calcula o progresso do usuário em cada unidade ativa: aulas concluídas, próxima aula e última atividade.
        /// </summary>
        /// <param name="publicUserId">Id público do usuário autenticado.</param>
        /// <returns>O progresso por unidade, ou 404 quando o usuário não existe.</returns>
        public async Task<UseCaseResult<List<UnityProgressResponse>>> ExecuteAsync(Guid publicUserId)
        {
            var user = await userRepository.GetAsync(u => u.PublicId == publicUserId);
            if (user is null) return new() { StatusCode = HttpStatusCode.NotFound };

            var unities = await unityRepository.GetListAsync(u => u.IsActive);
            var unityIds = unities.Select(u => u.Id).ToList();
            var lessons = await lessonRepository.GetListAsync(l => unityIds.Contains(l.UnityId));
            var answers = await answerRepository.GetListAsync(a => a.UserId == user.Id && unityIds.Contains(a.UnityId));
            var concludedLessonIds = GetConcludedLessonIds(answers);

            var progress = unities.Select(unity =>
            {
                var unityLessons = lessons.Where(l => l.UnityId == unity.Id).OrderBy(l => l.Sequence).ToList();
                var unityAnswers = answers.Where(a => a.UnityId == unity.Id).ToList();

                return new UnityProgressResponse
                {
                    UnityPublicId = unity.PublicId,
                    UnityName = unity.Name,
                    TotalLessons = unityLessons.Count,
                    ConcludedLessons = unityLessons.Count(l => concludedLessonIds.Contains(l.Id)),
                    NextLessonTitle = unityLessons.FirstOrDefault(l => !concludedLessonIds.Contains(l.Id))?.Title,
                    LastActivityAt = unityAnswers.Count == 0 ? null : unityAnswers.Max(a => a.CreatedAt),
                };
            }).ToList();

            return new() { Content = progress };
        }

        /// <summary>
        /// Identifica as aulas concluídas: as que têm respostas e cuja última resposta de cada questão está correta.
        /// </summary>
        /// <param name="answers">Todas as respostas do usuário.</param>
        /// <returns>Os ids internos das aulas concluídas.</returns>
        private static HashSet<int> GetConcludedLessonIds(List<Answer> answers)
        {
            return answers
                .GroupBy(a => a.LessonId)
                .Where(lessonAnswers => lessonAnswers
                    .GroupBy(a => a.QuestionId)
                    .All(questionAnswers => questionAnswers.OrderByDescending(a => a.CreatedAt).First().IsCorrect))
                .Select(lessonAnswers => lessonAnswers.Key)
                .ToHashSet();
        }
    }
}
