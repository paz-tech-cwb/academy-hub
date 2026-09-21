using domain.Interfaces.Repositories;
using domain.Interfaces.Services;

namespace infra.Services
{
    public class QuestionService(IQuestionRepository questionRepository, IAnswerRepository answerRepository) : IQuestionService
    {
        public async Task<bool> WasUnityCorrectlyAnswered(Guid publicUnityId, Guid publicUserId)
        {
            var unityQuestions = await questionRepository.GetListAsync(q => q.Unity.PublicId == publicUnityId);
            var userAnswers = await answerRepository.GetListAsync(a => 
                a.Unity.PublicId == publicUnityId &&
                a.User.PublicId == publicUserId &&
                a.IsCorrect
            );

            if (unityQuestions.Count == 0) return false;
            return userAnswers.Count == unityQuestions.Count;
        }
    }
}