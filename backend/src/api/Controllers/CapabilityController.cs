using application.Services;
using domain.Constants;
using domain.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [Route("api/capability")]
    [ApiController]
    [Authorize(Policy = Capabilities.PermissionsManage)]
    [Tags("Permissões")]
    public class CapabilityController(CapabilityService capabilityService) : ControllerBase
    {
        [EndpointSummary("Listar funcionalidades")]
        [EndpointDescription("Retorna o catálogo de funcionalidades. É o que cada perfil pode fazer: o código é usado no enforcement do backend e o rótulo, na interface. O catálogo é definido em código, então é somente leitura: funcionalidade não se cria, não se altera e não se exclui pela API.")]
        [ProducesResponseType<List<CapabilityResponse>>(StatusCodes.Status200OK)]
        [HttpGet]
        public async Task<ActionResult<List<CapabilityResponse>>> GetAll()
        {
            var result = await capabilityService.GetAllAsync();
            return StatusCode((int)result.StatusCode, result.Content);
        }
    }
}
