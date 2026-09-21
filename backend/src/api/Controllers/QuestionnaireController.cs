using System.Security.Claims;
using api.Controllers.Requests;
using application.UseCases;
using domain.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [Route("api/questionnaire")]
    [ApiController]
    [Authorize]
    public class QuestionnaireController(VerifyAnswersUseCase verifyAnswersUseCase, GetQuestionnaireUseCase _getQuestionnaireUseCase) : ControllerBase
    {
        [EndpointSummary("Validar Respostas")]
        [EndpointDescription("Recebe uma lista de respostas, valida essas respostas, grava o histórico de tentativas e retorna o resultado")]
        [ProducesResponseType<GetLastAnswersResponse>(StatusCodes.Status200OK, Description = "Quando as respostas foram validadas (independente se estavam corretas ou não).")]
        [ProducesResponseType<GetLastAnswersResponse>(StatusCodes.Status400BadRequest, Description = "Quando é passado algum parâmetro ou Id incorreto nas respostas.")]
        [HttpPost("verify-answers")]
        public async Task<ActionResult<GetLastAnswersResponse>> VerifyAnswers([FromBody] AnswerVerifyRequest answerVerifyRequest)
        {
            var publicUserId = User.FindFirst(ClaimTypes.NameIdentifier)!.Value;
            var result = await verifyAnswersUseCase.ExecuteAsync(answerVerifyRequest.PublicLessonId, answerVerifyRequest.UnityName, answerVerifyRequest.Answers, Guid.Parse(publicUserId));

            return StatusCode((int)result.StatusCode, result.Content);
        }

        [EndpointSummary("Obter lista")]
        [EndpointDescription("Retorna uma lista de questões e alternativas com base no nome da aula e nome da unidade.")]
        [ProducesResponseType<IEnumerable<QuestionDtoResponse>>(StatusCodes.Status200OK, Description = "Retorna a lista de questões daquela aula.")]
        [HttpGet("{unityName}/{lessonName}")]
        public async Task<ActionResult<IEnumerable<QuestionDtoResponse>>> GetList(string unityName, string lessonName)
        {
            var decodedUnityName = Uri.UnescapeDataString(unityName);
            var decodedLessonName = Uri.UnescapeDataString(lessonName);
            var result = await _getQuestionnaireUseCase.ExecuteAsync(decodedUnityName, decodedLessonName);

            return StatusCode((int)result.StatusCode, result.Content);
        }
    }
}