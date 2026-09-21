using domain.Interfaces.Repositories;
using domain.Models;

namespace infra.Repositories
{
    internal class UnityRepository(AppDbContext context) : BaseRepository<Unity>(context), IUnityRepository { }
}