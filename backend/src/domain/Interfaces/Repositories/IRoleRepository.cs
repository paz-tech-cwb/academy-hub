using domain.Models;

namespace domain.Interfaces.Repositories
{
    public interface IRoleRepository : IBaseRepository<Role>
    {
        /// <summary>Todas as funções com as funcionalidades vinculadas carregadas.</summary>
        Task<List<Role>> GetAllWithCapabilitiesAsync();

        /// <summary>Uma função com as funcionalidades vinculadas carregadas.</summary>
        Task<Role?> GetWithCapabilitiesAsync(Guid publicId);

        /// <summary>Indica se a função ainda tem usuários vinculados (FK RESTRICT).</summary>
        Task<bool> AnyUserWithRoleAsync(int roleId);

        /// <summary>O vínculo entre função e funcionalidade, quando existe.</summary>
        Task<RoleCapability?> GetAssignmentAsync(int roleId, int capabilityId);

        /// <summary>Cria o vínculo entre função e funcionalidade.</summary>
        Task AttachCapabilityAsync(int roleId, int capabilityId);

        /// <summary>Remove o vínculo entre função e funcionalidade.</summary>
        Task DetachCapabilityAsync(RoleCapability assignment);

        /// <summary>Códigos das funcionalidades da função, em uma única ida ao banco.</summary>
        Task<List<string>> GetCodesByRoleIdAsync(int roleId);
    }
}
