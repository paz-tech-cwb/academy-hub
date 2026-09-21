using api.Controllers.Requests;
using application.UseCases;
using domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [Route("api/admin/alternative")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    [Tags("Admin - Alternativas")]
    public class AdminAlternativeController(CreateAlternativeUseCase createAlternativeUseCase, UpdateAlternativeUseCase updateAlternativeUseCase, DeleteAlternativeUseCase deleteAlternativeUseCase) : ControllerBase
    {
        [EndpointSummary("Criar alternativa")]
        [EndpointDescription("Cria uma alternativa para uma questão (referenciada por publicId). Se for marcada como correta, desmarca as demais da mesma questão.")]
        [ProducesResponseType<Alternative>(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [HttpPost]
        public async Task<ActionResult<Alternative>> Create([FromBody] CreateAlternativeRequest request)
        {
            var result = await createAlternativeUseCase.ExecuteAsync(request.QuestionPublicId, request.Text, request.IsCorrect);
            return StatusCode((int)result.StatusCode, result.Content);
        }

        [EndpointSummary("Atualizar alternativa")]
        [EndpointDescription("Atualiza texto e corretude de uma alternativa. Se marcada como correta, desmarca as demais da mesma questão.")]
        [ProducesResponseType<Alternative>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [HttpPut("{publicId}")]
        public async Task<ActionResult<Alternative>> Update(Guid publicId, [FromBody] UpdateAlternativeRequest request)
        {
            var result = await updateAlternativeUseCase.ExecuteAsync(publicId, request.Text, request.IsCorrect);
            return StatusCode((int)result.StatusCode, result.Content);
        }

        [EndpointSummary("Excluir alternativa")]
        [EndpointDescription("Remove a alternativa e as respostas de usuários vinculadas a ela.")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [HttpDelete("{publicId}")]
        public async Task<IActionResult> Delete(Guid publicId)
        {
            var result = await deleteAlternativeUseCase.ExecuteAsync(publicId);
            return StatusCode((int)result.StatusCode);
        }
    }
}