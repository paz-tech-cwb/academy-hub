using domain.Interfaces.Services;
using domain.Models;
using Microsoft.EntityFrameworkCore;

namespace infra.Services
{
    public class AlternativeService(AppDbContext _context) : IAlternativeService
    {
        public async Task<Alternative?> GetCorrectAlternativeAsync(Guid publicQuestionId)
        {
            return await _context.Alternatives
            .Where(a => a.Question.PublicId == publicQuestionId && a.IsCorrect)
            .Include(a => a.Question)
            .FirstOrDefaultAsync();
        }
    }
}