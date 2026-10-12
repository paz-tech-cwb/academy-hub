using System.Net;
using application.Dtos;
using domain.Dtos;
using domain.Enums;
using domain.Interfaces.Repositories;
using domain.Interfaces.Services;
using domain.Models;

namespace application.Services
{
    /// <summary>
    /// CRUD de funções e dos vínculos com funcionalidades. Toda mutação termina
    /// invalidando o cache do resolver, para que a mudança valha no próximo
    /// request em vez de esperar o TTL.
    /// </summary>
    public class RoleService(
        IRoleRepository roleRepository,
        ICapabilityRepository capabilityRepository,
        ICapabilityResolver capabilityResolver)
    {
        private const string SystemRoleMessage = "Esta role é do sistema e não pode ser alterada ou excluída.";
        private const string DuplicatedNameMessage = "Já existe uma função com esse nome.";

        public async Task<UseCaseResult<List<RoleResponse>>> GetAllAsync()
        {
            var roles = await roleRepository.GetAllWithCapabilitiesAsync();

            return new() { Content = roles.Select(ToResponse).ToList() };
        }

        public async Task<UseCaseResult<object>> CreateAsync(string name, string? description)
        {
            if (await roleRepository.GetAsync(r => r.Name == name) is not null)
                return Conflict(DuplicatedNameMessage);

            var role = await roleRepository.InsertAsync(new Role
            {
                Name = name,
                Description = description
            });

            capabilityResolver.Invalidate();

            return new() { Content = ToResponse(role), StatusCode = HttpStatusCode.Created };
        }

        public async Task<UseCaseResult<object>> UpdateAsync(Guid publicId, string name, string? description)
        {
            var role = await roleRepository.GetAsync(r => r.PublicId == publicId);
            if (role is null) return NotFound();

            // Segunda camada do anti-lockout: User e Admin são do sistema.
            if (role.IsSystem) return Conflict(SystemRoleMessage);

            var nameOwner = await roleRepository.GetAsync(r => r.Name == name);
            if (nameOwner is not null && nameOwner.Id != role.Id)
                return Conflict(DuplicatedNameMessage);

            role.Name = name;
            role.Description = description;
            await roleRepository.UpdateAsync(role);

            capabilityResolver.Invalidate();

            return NoContent();
        }

        public async Task<UseCaseResult<object>> DeleteAsync(Guid publicId)
        {
            var role = await roleRepository.GetAsync(r => r.PublicId == publicId);
            if (role is null) return NotFound();

            if (role.IsSystem) return Conflict(SystemRoleMessage);

            // Espelha o RESTRICT da fk_users_role: checar antes devolve um 409
            // amigável em vez de deixar o DbUpdateException virar 500.
            if (await roleRepository.AnyUserWithRoleAsync(role.Id))
                return Conflict("Não é possível excluir uma role que ainda possui usuários vinculados.");

            await roleRepository.DeleteAsync(role);

            capabilityResolver.Invalidate();

            return NoContent();
        }

        public async Task<UseCaseResult<object>> AttachCapabilityAsync(Guid rolePublicId, Guid capabilityPublicId)
        {
            var role = await roleRepository.GetAsync(r => r.PublicId == rolePublicId);
            if (role is null) return NotFound();

            var capability = await capabilityRepository.GetAsync(c => c.PublicId == capabilityPublicId);
            if (capability is null) return NotFound();

            // Idempotente: vínculo que já existe não é erro.
            if (await roleRepository.GetAssignmentAsync(role.Id, capability.Id) is null)
            {
                await roleRepository.AttachCapabilityAsync(role.Id, capability.Id);
                capabilityResolver.Invalidate();
            }

            return NoContent();
        }

        public async Task<UseCaseResult<object>> DetachCapabilityAsync(Guid rolePublicId, Guid capabilityPublicId)
        {
            var role = await roleRepository.GetAsync(r => r.PublicId == rolePublicId);
            if (role is null) return NotFound();

            // Terceira camada do anti-lockout: qualquer que seja a
            // funcionalidade, o Admin não perde vínculos.
            if (role.Id == (int)Roles.Admin)
                return Conflict("A role Admin não pode ter funcionalidades removidas: ela sempre tem acesso total.");

            var capability = await capabilityRepository.GetAsync(c => c.PublicId == capabilityPublicId);
            if (capability is null) return NotFound();

            var assignment = await roleRepository.GetAssignmentAsync(role.Id, capability.Id);
            if (assignment is null) return NotFound();

            await roleRepository.DetachCapabilityAsync(assignment);

            capabilityResolver.Invalidate();

            return NoContent();
        }

        private static RoleResponse ToResponse(Role role) => new()
        {
            PublicId = role.PublicId,
            Name = role.Name,
            Description = role.Description,
            IsSystem = role.IsSystem,
            Capabilities = role.RoleCapabilities
                .Select(rc => new CapabilityResponse
                {
                    PublicId = rc.Capability.PublicId,
                    Code = rc.Capability.Code,
                    Name = rc.Capability.Name,
                    Description = rc.Capability.Description
                })
                .OrderBy(c => c.Name)
                .ToList()
        };

        private static UseCaseResult<object> NoContent() => new() { StatusCode = HttpStatusCode.NoContent };

        private static UseCaseResult<object> NotFound() => new() { StatusCode = HttpStatusCode.NotFound };

        private static UseCaseResult<object> Conflict(string message) => new()
        {
            StatusCode = HttpStatusCode.Conflict,
            Content = new MessageResponse { Message = message }
        };
    }
}
