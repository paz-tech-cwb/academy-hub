using api.Authorization;
using domain.Constants;
using domain.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [Route("api/me")]
    [ApiController]
    [Authorize]
    [Tags("Permissões")]
    public class MeController(ICapabilityResolver capabilityResolver) : ControllerBase
    {
        [EndpointSummary("Minhas funcionalidades")]
        [EndpointDescription("Retorna os códigos das funcionalidades liberadas para o usuário autenticado. O front usa essa lista para decidir quais cards de configuração exibir. Quem não tem nenhuma funcionalidade recebe uma lista vazia, e não um erro: é o estado de quem abre as configurações e não vê nenhum card.")]
        [ProducesResponseType<string[]>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized, Description = "Quando o usuário não está autenticado.")]
        [HttpGet("capabilities")]
        public async Task<ActionResult<string[]>> GetCapabilities()
        {
            // Da constante, e não do banco: assim a tela de configurações de um
            // Admin não colapsa a zero cards se a tabela estiver vazia ou
            // inacessível.
            if (User.IsPlatformAdmin()) return Ok(Capabilities.All);

            if (!User.TryGetUserPublicId(out var userPublicId)) return Ok(Array.Empty<string>());

            var capabilities = await capabilityResolver.ResolveAsync(userPublicId);

            return Ok(capabilities.ToArray());
        }
    }
}
