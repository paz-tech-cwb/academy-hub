using api.Controllers.Requests;
using api.Controllers.Responses;
using application.UseCases;
using domain.Interfaces.Repositories;
using domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers
{
    [Route("api/admin/lesson")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    [Tags("Admin - Aulas")]
    public class AdminLessonController(ILessonRepository lessonRepository, CreateLessonUseCase createLessonUseCase, DeleteLessonUseCase deleteLessonUseCase) : ControllerBase
    {
        [EndpointSummary("Criar aula")]
        [EndpointDescription("Cria uma aula dentro de uma unidade existente (referenciada por publicId). Quando a URL do vídeo não é informada, fica vazia.")]
        [ProducesResponseType<Lesson>(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [HttpPost]
        public async Task<ActionResult<Lesson>> Create([FromBody] CreateLessonRequest request)
        {
            var result = await createLessonUseCase.ExecuteAsync(
                request.UnityPublicId,
                request.Title,
                request.Description,
                request.Sequence,
                request.VideoUrl);

            return StatusCode((int)result.StatusCode, result.Content);
        }

        [EndpointSummary("Atualizar aula")]
        [EndpointDescription("Atualiza título, descrição, sequência e vídeo de uma aula existente.")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [HttpPut("{publicId}")]
        public async Task<IActionResult> Update(Guid publicId, [FromBody] UpdateLessonRequest request)
        {
            var lesson = await lessonRepository.GetAsync(l => l.PublicId == publicId);
            if (lesson is null) return NotFound();

            lesson.Title = request.Title;
            lesson.Description = request.Description;
            lesson.Sequence = request.Sequence;
            lesson.VideoUrl = string.IsNullOrWhiteSpace(request.VideoUrl) ? "" : request.VideoUrl;

            try
            {
                await lessonRepository.UpdateAsync(lesson);
            }
            catch (DbUpdateException)
            {
                return BadRequest();
            }

            return NoContent();
        }

        [EndpointSummary("Excluir aula")]
        [EndpointDescription("Remove a aula e tudo que dela depende (questões, alternativas e respostas) em cascata.")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [HttpDelete("{publicId}")]
        public async Task<IActionResult> Delete(Guid publicId)
        {
            var result = await deleteLessonUseCase.ExecuteAsync(publicId);
            return StatusCode((int)result.StatusCode);
        }

        [EndpointSummary("Obter árvore admin da aula")]
        [EndpointDescription("Retorna a aula com suas questões e alternativas, incluindo a alternativa correta de cada questão. Uso exclusivo do admin.")]
        [ProducesResponseType<AdminLessonResponse>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [HttpGet("{publicId}")]
        public async Task<ActionResult<AdminLessonResponse>> Get(Guid publicId)
        {
            var lesson = await lessonRepository.GetLesson(publicId);
            if (lesson is null) return NotFound();

            var response = new AdminLessonResponse
            {
                PublicId = lesson.PublicId,
                Title = lesson.Title,
                Description = lesson.Description,
                Sequence = lesson.Sequence,
                VideoUrl = lesson.VideoUrl,
                Questions = lesson.Questions.Select(q => new AdminQuestionResponse
                {
                    PublicId = q.PublicId,
                    Statement = q.Statement,
                    Alternatives = q.Alternatives.Select(a => new AdminAlternativeResponse
                    {
                        PublicId = a.PublicId,
                        Text = a.Text,
                        IsCorrect = a.IsCorrect
                    }).ToList()
                }).ToList()
            };

            return Ok(response);
        }
    }
}