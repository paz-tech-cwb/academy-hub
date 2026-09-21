using System.Net;
using application.Dtos;
using domain.Interfaces.Repositories;

namespace application.UseCases
{
    public class DeleteUnityUseCase(
        IUnityRepository unityRepository,
        ILessonRepository lessonRepository,
        IQuestionRepository questionRepository,
        IAlternativeRepository alternativeRepository,
        IAnswerRepository answerRepository,
        ICertificateRepository certificateRepository)
    {
        public async Task<UseCaseResult<object>> ExecuteAsync(Guid publicId)
        {
            var unity = await unityRepository.GetAsync(u => u.PublicId == publicId);
            if (unity is null)
                return new() { StatusCode = HttpStatusCode.NotFound };

            var certificates = await certificateRepository.GetListAsync(c => c.UnityId == unity.Id);
            var answers = await answerRepository.GetListAsync(a => a.UnityId == unity.Id);
            var alternatives = await alternativeRepository.GetListAsync(a => a.Question.UnityId == unity.Id);
            var questions = await questionRepository.GetListAsync(q => q.UnityId == unity.Id);
            var lessons = await lessonRepository.GetListAsync(l => l.UnityId == unity.Id);

            if (certificates.Count > 0) await certificateRepository.DeleteRangeAsync(certificates);
            if (answers.Count > 0) await answerRepository.DeleteRangeAsync(answers);
            if (alternatives.Count > 0) await alternativeRepository.DeleteRangeAsync(alternatives);
            if (questions.Count > 0) await questionRepository.DeleteRangeAsync(questions);
            if (lessons.Count > 0) await lessonRepository.DeleteRangeAsync(lessons);

            await unityRepository.DeleteAsync(unity);

            return new();
        }
    }
}