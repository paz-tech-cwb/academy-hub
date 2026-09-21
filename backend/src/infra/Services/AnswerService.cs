using domain.Dtos.Publics;
using domain.Dtos;
using domain.Interfaces.Repositories;
using domain.Interfaces.Services;
using domain.Models;
using Microsoft.EntityFrameworkCore;

namespace infra.Services
{
    public class AnswerService(
        AppDbContext _context,
        IAlternativeService _alternativeService,
        IUnityRepository _unityRepository,
        IAnswerRepository _answerRepository,
        IUserRepository _userRepository,
        IAlternativeRepository _alternativeRepository) : IAnswerService
    {
        const int DEFAULT_POINTS = 300;

        private async Task<List<Answer>> GetAnswersByUserAndLesson(Guid publicUserId, Guid publicLessonId)
        {
            return await _context.Answers
                .Include(a => a.Question)
                .Include(a => a.Alternative)
                .Where(a => a.User.PublicId == publicUserId && a.Lesson.PublicId == publicLessonId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
        }

        public async Task<GetLastAnswersResponse> GetLastAnswersAsync(Guid publicUserId, Guid publicLessonId)
        {
            var userAnswers = await GetAnswersByUserAndLesson(publicUserId, publicLessonId);

            var answers = GetAnswerVerifyOuts(userAnswers);

            return new GetLastAnswersResponse
            {
                Answers = answers,
                CurrentPointsWeight = CalculatePoints(userAnswers)
            };
        }

        public async Task<GetLastAnswersResponse?> VerifyAnswersAsync(Guid publicLessonId, string unityName, List<PublicAnswerDto> answers, Guid publicUserId, Guid publicUnityId)
        {
            var answersToInsert = new List<Answer>();
            var user = await _userRepository.GetAsyncNotNull(user => user.PublicId == publicUserId);
            var unity = await _unityRepository.GetAsyncNotNull(unity => unity.PublicId == publicUnityId);

            foreach (var answer in answers)
            {
                var correctAlternative = await _alternativeService.GetCorrectAlternativeAsync(answer.PublicQuestionId);
                if (correctAlternative is null) return null;
                var alternative = await _alternativeRepository.GetAsyncNotNull(alt => alt.PublicId == answer.PublicAlternativeId);

                answersToInsert.Add(new Answer
                {
                    AlternativeId = alternative.Id,
                    UserId = user.Id,
                    QuestionId = alternative.QuestionId,
                    LessonId = alternative.Question.LessonId,
                    UnityId = unity.Id,
                    IsCorrect = answer.PublicAlternativeId == correctAlternative.PublicId,
                    CreatedAt = DateTime.Now,
                });
            }

            await _answerRepository.InsertRangeAsync(answersToInsert);

            var lastAnswers = await GetLastAnswersAsync(publicUserId, publicLessonId);

            if (!lastAnswers.Answers.Any(ai => !ai.IsCorrect))
            {
                await _userRepository.AddExperience(lastAnswers.CurrentPointsWeight, publicUserId);
            }

            return lastAnswers;
        }

        private static List<AnswerVerifyOut> GetAnswerVerifyOuts(List<Answer> userAnswers)
        {
            var lessonQuestionsIds = userAnswers
            .GroupBy(a => a.Question.PublicId)
            .Select(g => g.Key)
            .ToList();

            var lastAnswers = lessonQuestionsIds
            .Select(lqi => userAnswers.First(a => a.Question.PublicId == lqi))
            .ToList();

            var answers = lastAnswers
            .Select(la => new AnswerVerifyOut
            {
                PublicAlternativeId = la.Alternative.PublicId,
                PublicQuestionId = la.Question.PublicId,
                IsCorrect = la.IsCorrect,
            })
            .ToList();

            return answers;
        }

        private static int CalculatePoints(List<Answer> userAnswers)
        {
            int qtdErros = userAnswers.Count(ua => !ua.IsCorrect);
            int pontosPerdidos = qtdErros * 50;
            int points = DEFAULT_POINTS - pontosPerdidos;

            if (points <= 0)
            {
                points = 50;
            }

            return points;
        }
    }
}