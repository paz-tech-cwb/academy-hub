using api.Controllers.Requests;
using application.Dtos;
using application.Services;
using domain.Constants;
using domain.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [Route("api/role")]
    [ApiController]
    [Authorize(Policy = Capabilities.PermissionsManage)]
    [Tags("Permissões")]
    public class RoleController(RoleService roleService) : ControllerBase
    {
        [EndpointSummary("Listar funções")]
        [EndpointDescription("Retorna todas as funções com as funcionalidades vinculadas a cada uma. A função é o que se atribui ao usuário, e são as funcionalidades dela que definem o que ela pode fazer.")]
        [ProducesResponseType<List<RoleResponse>>(StatusCodes.Status200OK)]
        [HttpGet]
        public async Task<ActionResult<List<RoleResponse>>> GetAll()
        {
            var result = await roleService.GetAllAsync();
            return StatusCode((int)result.StatusCode, result.Content);
        }

        [EndpointSummary("Criar função")]
        [EndpointDescription("Cria uma função sem nenhuma funcionalidade vinculada. As funcionalidades são vinculadas depois, em chamadas separadas.")]
        [ProducesResponseType<RoleResponse>(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType<MessageResponse>(StatusCodes.Status409Conflict, Description = "Quando já existe uma função com esse nome.")]
        [HttpPost]
        public async Task<ActionResult<RoleResponse>> Create([FromBody] CreateRoleRequest request)
        {
            var result = await roleService.CreateAsync(request.Name, request.Description);
            return StatusCode((int)result.StatusCode, result.Content);
        }

        [EndpointSummary("Atualizar função")]
        [EndpointDescription("Atualiza nome e descrição de uma função. Funções do sistema não podem ser alteradas.")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType<MessageResponse>(StatusCodes.Status409Conflict, Description = "Quando a função é do sistema ou o nome já existe.")]
        [HttpPut("{publicId}")]
        public async Task<IActionResult> Update(Guid publicId, [FromBody] UpdateRoleRequest request)
        {
            var result = await roleService.UpdateAsync(publicId, request.Name, request.Description);
            return StatusCode((int)result.StatusCode, result.Content);
        }

        [EndpointSummary("Excluir função")]
        [EndpointDescription("Exclui uma função. Funções do sistema e funções que ainda têm usuários vinculados não podem ser excluídas.")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType<MessageResponse>(StatusCodes.Status409Conflict, Description = "Quando a função é do sistema ou ainda possui usuários.")]
        [HttpDelete("{publicId}")]
        public async Task<IActionResult> Delete(Guid publicId)
        {
            var result = await roleService.DeleteAsync(publicId);
            return StatusCode((int)result.StatusCode, result.Content);
        }

        [EndpointSummary("Vincular funcionalidade à função")]
        [EndpointDescription("Vincula uma funcionalidade à função. A operação é idempotente: vincular uma funcionalidade que já está vinculada não é erro. Quem tem a função ganha o acesso no próximo request, sem precisar relogar.")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [HttpPost("{publicId}/capability")]
        public async Task<IActionResult> AttachCapability(Guid publicId, [FromBody] AttachCapabilityRequest request)
        {
            var result = await roleService.AttachCapabilityAsync(publicId, request.CapabilityPublicId);
            return StatusCode((int)result.StatusCode, result.Content);
        }

        [EndpointSummary("Desvincular funcionalidade da função")]
        [EndpointDescription("Remove o vínculo entre a função e a funcionalidade. A função Admin nunca pode ter funcionalidades removidas, porque ela sempre tem acesso total.")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType<MessageResponse>(StatusCodes.Status409Conflict, Description = "Quando a função é a Admin.")]
        [HttpDelete("{publicId}/capability/{capabilityPublicId}")]
        public async Task<IActionResult> DetachCapability(Guid publicId, Guid capabilityPublicId)
        {
            var result = await roleService.DetachCapabilityAsync(publicId, capabilityPublicId);
            return StatusCode((int)result.StatusCode, result.Content);
        }
    }
}
