using System.Net;
using application.Dtos;
using domain.Interfaces.Repositories;

namespace application.UseCases
{
    public class DeleteAlternativeUseCase(
        IAlternativeRepository alternativeRepository,
        IAnswerRepository answerRepository)
    {
        public async Task<UseCaseResult<object>> ExecuteAsync(Guid publicId)
        {
            var alternative = await alternativeRepository.GetAsync(a => a.PublicId == publicId);
            if (alternative is null)
                return new() { StatusCode = HttpStatusCode.NotFound };

            var answers = await answerRepository.GetListAsync(a => a.AlternativeId == alternative.Id);
            if (answers.Count > 0) await answerRepository.DeleteRangeAsync(answers);

            await alternativeRepository.DeleteAsync(alternative);

            return new();
        }
    }
}