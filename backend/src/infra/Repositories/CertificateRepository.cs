using domain.Interfaces.Repositories;
using domain.Models;
using Microsoft.EntityFrameworkCore;

namespace infra.Repositories
{
    internal class CertificateRepository(AppDbContext context) : BaseRepository<Certificate>(context), ICertificateRepository
    {
        public async Task<List<Certificate>> GetCertificatesByUserId(Guid publicUserId)
        {
            return await context.Certificates
                .Include(c => c.Unity)
                .Include(c => c.User)
                .Where(c => c.User != null && c.User.PublicId == publicUserId)
                .ToListAsync();
        }
    }
}