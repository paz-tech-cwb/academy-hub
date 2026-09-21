using api.Controllers.Requests;
using application.UseCases;
using domain.Interfaces.Repositories;
using domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers
{
    [Route("api/admin/unity")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    [Tags("Admin - Unidades")]
    public class AdminUnityController(IUnityRepository unityRepository, CreateUnityUseCase createUnityUseCase, DeleteUnityUseCase deleteUnityUseCase) : ControllerBase
    {
        [EndpointSummary("Criar unidade")]
        [EndpointDescription("Valida a unicidade do nome e cria uma nova unidade.")]
        [ProducesResponseType<Unity>(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [HttpPost]
        public async Task<ActionResult<Unity>> Create([FromBody] CreateUnityRequest request)
        {
            var result = await createUnityUseCase.ExecuteAsync(request.Name, request.Description);
            return StatusCode((int)result.StatusCode, result.Content);
        }

        [EndpointSummary("Atualizar unidade")]
        [EndpointDescription("Atualiza nome e descrição de uma unidade existente, referenciada pelo publicId.")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [HttpPut("{publicId}")]
        public async Task<IActionResult> Update(Guid publicId, [FromBody] UpdateUnityRequest request)
        {
            var unity = await unityRepository.GetAsync(u => u.PublicId == publicId);
            if (unity is null) return NotFound();

            unity.Name = request.Name;
            unity.Description = request.Description;

            try
            {
                await unityRepository.UpdateAsync(unity);
            }
            catch (DbUpdateException)
            {
                return BadRequest();
            }

            return NoContent();
        }

        [EndpointSummary("Excluir unidade")]
        [EndpointDescription("Remove a unidade e tudo que dela depende (aulas, questões, alternativas, respostas e certificados) em cascata.")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [HttpDelete("{publicId}")]
        public async Task<IActionResult> Delete(Guid publicId)
        {
            var result = await deleteUnityUseCase.ExecuteAsync(publicId);
            return StatusCode((int)result.StatusCode);
        }
    }
}