using domain.Interfaces.Repositories;
using domain.Models;

namespace infra.Repositories
{
    internal class AlternativeRepository(AppDbContext context) : BaseRepository<Alternative>(context), IAlternativeRepository { }
}