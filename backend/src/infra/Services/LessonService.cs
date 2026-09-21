using domain.Interfaces.Services;

namespace infra.Services
{
    public class LessonService(IAnswerService answerService) : ILessonService
    {
        public async Task<bool> LessonAreAlreadyAnswered(Guid publicUserId, Guid lessonId)
        {
            var oldLastAnswers = await answerService.GetLastAnswersAsync(publicUserId, lessonId);

            if (oldLastAnswers.Answers.Count == 0)
            {
                return false;
            }
            var theresAnswers = oldLastAnswers.Answers.Count > 0;
            var theresWrongAnswers = oldLastAnswers.Answers.Any(la => !la.IsCorrect);
            var allAnswersAreCorrect = !theresWrongAnswers;

            return theresAnswers && allAnswersAreCorrect;
        }
    }
}
