using domain.Models;

namespace domain.Interfaces.Services
{
    public interface IAlternativeService
    {
        public Task<Alternative?> GetCorrectAlternativeAsync(Guid publicQuestionId);
    }
}