using api.Controllers.Requests;
using application.UseCases;
using domain.Interfaces.Repositories;
using domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [Route("api/admin/question")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    [Tags("Admin - Questões")]
    public class AdminQuestionController(IQuestionRepository questionRepository, CreateQuestionUseCase createQuestionUseCase, DeleteQuestionUseCase deleteQuestionUseCase) : ControllerBase
    {
        [EndpointSummary("Criar questão")]
        [EndpointDescription("Cria uma questão dentro de uma aula existente (referenciada por publicId).")]
        [ProducesResponseType<Question>(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [HttpPost]
        public async Task<ActionResult<Question>> Create([FromBody] CreateQuestionRequest request)
        {
            var result = await createQuestionUseCase.ExecuteAsync(request.LessonPublicId, request.Statement);
            return StatusCode((int)result.StatusCode, result.Content);
        }

        [EndpointSummary("Atualizar questão")]
        [EndpointDescription("Atualiza o enunciado de uma questão existente.")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [HttpPut("{publicId}")]
        public async Task<IActionResult> Update(Guid publicId, [FromBody] UpdateQuestionRequest request)
        {
            var question = await questionRepository.GetAsync(q => q.PublicId == publicId);
            if (question is null) return NotFound();

            question.Statement = request.Statement;
            await questionRepository.UpdateAsync(question);

            return NoContent();
        }

        [EndpointSummary("Excluir questão")]
        [EndpointDescription("Remove a questão e o que dela depende (alternativas e respostas) em cascata.")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [HttpDelete("{publicId}")]
        public async Task<IActionResult> Delete(Guid publicId)
        {
            var result = await deleteQuestionUseCase.ExecuteAsync(publicId);
            return StatusCode((int)result.StatusCode);
        }
    }
}