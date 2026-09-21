using System.Net;
using application.Dtos;
using domain.Interfaces.Repositories;

namespace application.UseCases
{
    public class DeleteQuestionUseCase(
        IQuestionRepository questionRepository,
        IAlternativeRepository alternativeRepository,
        IAnswerRepository answerRepository)
    {
        public async Task<UseCaseResult<object>> ExecuteAsync(Guid publicId)
        {
            var question = await questionRepository.GetAsync(q => q.PublicId == publicId);
            if (question is null)
                return new() { StatusCode = HttpStatusCode.NotFound };

            var answers = await answerRepository.GetListAsync(a => a.QuestionId == question.Id);
            var alternatives = await alternativeRepository.GetListAsync(a => a.QuestionId == question.Id);

            if (answers.Count > 0) await answerRepository.DeleteRangeAsync(answers);
            if (alternatives.Count > 0) await alternativeRepository.DeleteRangeAsync(alternatives);

            await questionRepository.DeleteAsync(question);

            return new();
        }
    }
}