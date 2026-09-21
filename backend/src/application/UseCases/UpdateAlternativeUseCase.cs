using System.Net;
using application.Dtos;
using domain.Interfaces.Repositories;
using domain.Models;

namespace application.UseCases
{
    public class UpdateAlternativeUseCase(IAlternativeRepository alternativeRepository)
    {
        public async Task<UseCaseResult<Alternative>> ExecuteAsync(Guid publicId, string text, bool isCorrect)
        {
            var alternative = await alternativeRepository.GetAsync(a => a.PublicId == publicId);
            if (alternative is null)
                return new() { StatusCode = HttpStatusCode.NotFound };

            if (isCorrect)
            {
                var others = await alternativeRepository.GetListAsync(a => a.QuestionId == alternative.QuestionId && a.IsCorrect && a.Id != alternative.Id);
                foreach (var other in others)
                {
                    other.IsCorrect = false;
                    await alternativeRepository.UpdateAsync(other);
                }
            }

            alternative.Text = text;
            alternative.IsCorrect = isCorrect;
            await alternativeRepository.UpdateAsync(alternative);

            return new() { Content = alternative };
        }
    }
}