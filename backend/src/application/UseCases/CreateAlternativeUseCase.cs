using System.Net;
using application.Dtos;
using domain.Interfaces.Repositories;
using domain.Models;

namespace application.UseCases
{
    public class CreateAlternativeUseCase(
        IQuestionRepository questionRepository,
        IAlternativeRepository alternativeRepository)
    {
        public async Task<UseCaseResult<Alternative>> ExecuteAsync(Guid questionPublicId, string text, bool isCorrect)
        {
            var question = await questionRepository.GetAsync(q => q.PublicId == questionPublicId);
            if (question is null)
                return new() { StatusCode = HttpStatusCode.NotFound };

            if (isCorrect)
            {
                var others = await alternativeRepository.GetListAsync(a => a.QuestionId == question.Id && a.IsCorrect);
                foreach (var other in others)
                {
                    other.IsCorrect = false;
                    await alternativeRepository.UpdateAsync(other);
                }
            }

            var alternative = new Alternative
            {
                Text = text,
                IsCorrect = isCorrect,
                QuestionId = question.Id
            };

            var created = await alternativeRepository.InsertAsync(alternative);
            return new() { Content = created, StatusCode = HttpStatusCode.Created };
        }
    }
}