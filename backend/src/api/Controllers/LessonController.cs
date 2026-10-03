using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using api.Controllers.Requests;
using api.Controllers.Responses;
using application.Dtos;
using application.UseCases;
using domain.Interfaces.Repositories;
using domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers
{
    [Route("api/lesson")]
    [ApiController]
    [Authorize]
    public class LessonController(GetLessonsUseCase getLessonsUseCase, GetLessonUseCase getLessonUseCase, CreateLessonUseCase createLessonUseCase, ILessonRepository lessonRepository, DeleteLessonUseCase deleteLessonUseCase) : ControllerBase
    {
        [EndpointSummary("Obter Lista")]
        [EndpointDescription("Retorna uma lista de aulas com base no nome da unidade")]
        [HttpGet("list/{unityName}")]
        public async Task<ActionResult<List<GetLessonsResponse>>> GetLessonsFromUnity([FromRoute][Required] string unityName)
        {
            var decodedUnityName = Uri.UnescapeDataString(unityName);
            var publicUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
            var result = await getLessonsUseCase.ExecuteAsync(decodedUnityName, Guid.Parse(publicUserId));

            return StatusCode((int)result.StatusCode, result.Content?.Select(l => new GetLessonsResponse
            {
                PublicId = l.PublicId,
                Title = l.Title,
                Sequence = l.Sequence,
                Concluded = l.Concluded
            }));
        }

        [EndpointSummary("Obter único")]
        [EndpointDescription("Retorna uma Lesson baseada no seu PublicId")]
        [ProducesResponseType<LessonResponseDto>(StatusCodes.Status200OK, Description = "Quando a aula é encontrada.")]
        [ProducesResponseType(StatusCodes.Status204NoContent, Description = "Quando a aula não foi encontrada.")]
        [HttpGet("{unityName}/{lessonName}")]
        public async Task<ActionResult<LessonResponseDto>> GetLesson(string unityName, string lessonName)
        {
            var decodedUnityName = Uri.UnescapeDataString(unityName);
            var decodedLessonName = Uri.UnescapeDataString(lessonName);
            var publicUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
            var result = await getLessonUseCase.ExecuteAsync(decodedUnityName, decodedLessonName, Guid.Parse(publicUserId));

            return StatusCode((int)result.StatusCode, result.Content);
        }

        [Authorize(Roles = "Admin")]
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

        [Authorize(Roles = "Admin")]
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

        [Authorize(Roles = "Admin")]
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

        [Authorize(Roles = "Admin")]
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
