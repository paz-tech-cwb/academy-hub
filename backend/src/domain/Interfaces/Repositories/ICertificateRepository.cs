using domain.Models;

namespace domain.Interfaces.Repositories
{
    public interface ICertificateRepository : IBaseRepository<Certificate>
    {
        Task<List<Certificate>> GetCertificatesByUserId(Guid userId);
    }
}