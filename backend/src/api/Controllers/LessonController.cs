using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using api.Controllers.Responses;
using application.Dtos;
using application.UseCases;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [Route("api/lesson")]
    [ApiController]
    [Authorize]
    public class LessonController(GetLessonsUseCase getLessonsUseCase, GetLessonUseCase getLessonUseCase) : ControllerBase
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
    }
}
