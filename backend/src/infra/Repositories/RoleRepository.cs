using domain.Enums;
using domain.Interfaces.Repositories;
using domain.Models;
using Microsoft.EntityFrameworkCore;

namespace infra.Repositories
{
    internal class RoleRepository(AppDbContext context) : BaseRepository<Role>(context), IRoleRepository
    {
        public async Task<List<Role>> GetAllWithCapabilitiesAsync()
        {
            return await context.Roles
                .Include(r => r.RoleCapabilities)
                .ThenInclude(rc => rc.Capability)
                .OrderBy(r => r.Id)
                .ToListAsync();
        }

        public async Task<Role?> GetWithCapabilitiesAsync(Guid publicId)
        {
            return await context.Roles
                .Include(r => r.RoleCapabilities)
                .ThenInclude(rc => rc.Capability)
                .FirstOrDefaultAsync(r => r.PublicId == publicId);
        }

        public async Task<bool> AnyUserWithRoleAsync(int roleId)
        {
            var role = (Roles)roleId;
            return await context.Users.AnyAsync(u => u.Role == role);
        }

        public async Task<RoleCapability?> GetAssignmentAsync(int roleId, int capabilityId)
        {
            return await context.RoleCapabilities
                .FirstOrDefaultAsync(rc => rc.RoleId == roleId && rc.CapabilityId == capabilityId);
        }

        public async Task AttachCapabilityAsync(int roleId, int capabilityId)
        {
            await context.RoleCapabilities.AddAsync(new RoleCapability
            {
                RoleId = roleId,
                CapabilityId = capabilityId
            });

            await context.SaveChangesAsync();
        }

        public async Task DetachCapabilityAsync(RoleCapability assignment)
        {
            context.RoleCapabilities.Remove(assignment);
            await context.SaveChangesAsync();
        }

        /// <summary>
        /// Query quente do enforcement: uma única ida ao banco, sem carregar
        /// as entidades intermediárias.
        /// </summary>
        public async Task<List<string>> GetCodesByRoleIdAsync(int roleId)
        {
            return await context.RoleCapabilities
                .Where(rc => rc.RoleId == roleId)
                .Select(rc => rc.Capability.Code)
                .Distinct()
                .ToListAsync();
        }
    }
}
