using domain.Interfaces.Repositories;
using domain.Models;

namespace infra.Repositories
{
    internal class CapabilityRepository(AppDbContext context) : BaseRepository<Capability>(context), ICapabilityRepository
    {
    }
}
