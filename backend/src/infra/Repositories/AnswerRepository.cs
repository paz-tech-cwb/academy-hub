using domain.Interfaces.Repositories;
using domain.Models;

namespace infra.Repositories
{
    internal class AnswerRepository(AppDbContext context) : BaseRepository<Answer>(context), IAnswerRepository { }
}