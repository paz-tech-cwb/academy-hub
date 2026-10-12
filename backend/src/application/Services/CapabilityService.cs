using application.Dtos;
using domain.Dtos;
using domain.Interfaces.Repositories;
using domain.Models;

namespace application.Services
{
    /// <summary>
    /// O catálogo é definido em código, então é somente leitura: o código da
    /// funcionalidade está no atributo de autorização do endpoint, e rótulo e
    /// descrição vêm do script de permissionamento.
    /// </summary>
    public class CapabilityService(ICapabilityRepository capabilityRepository)
    {
        public async Task<UseCaseResult<List<CapabilityResponse>>> GetAllAsync()
        {
            var capabilities = await capabilityRepository.GetListAsync(c => true);

            return new()
            {
                Content = capabilities.OrderBy(c => c.Code).Select(ToResponse).ToList()
            };
        }

        private static CapabilityResponse ToResponse(Capability capability) => new()
        {
            PublicId = capability.PublicId,
            Code = capability.Code,
            Name = capability.Name,
            Description = capability.Description
        };
    }
}
