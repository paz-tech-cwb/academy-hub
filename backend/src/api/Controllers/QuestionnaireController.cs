using System.Security.Claims;
using api.Authorization;
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
    public class QuestionnaireController(VerifyAnswersUseCase verifyAnswersUseCase, GetQuestionnaireUseCase _getQuestionnaireUseCase, IAuthorizationService authorizationService) : ControllerBase
    {
        [EndpointSummary("Validar Respostas")]
        [EndpointDescription("Recebe uma lista de respostas, valida essas respostas, grava o histórico de tentativas e retorna o resultado. Aulas de unidades inativas nunca aceitam respostas, nem de quem visualiza ou gerencia conteúdos.")]
        [ProducesResponseType<GetLastAnswersResponse>(StatusCodes.Status200OK, Description = "Quando as respostas foram validadas (independente se estavam corretas ou não).")]
        [ProducesResponseType<GetLastAnswersResponse>(StatusCodes.Status400BadRequest, Description = "Quando é passado algum parâmetro ou Id incorreto nas respostas, alguma alternativa não pertence à aula, ou a unidade está inativa e o usuário visualiza ou gerencia conteúdos.")]
        [ProducesResponseType<GetLastAnswersResponse>(StatusCodes.Status404NotFound, Description = "Quando a unidade ou a aula não existe, a aula não pertence à unidade, ou a unidade está inativa e o usuário não visualiza nem gerencia conteúdos.")]
        [HttpPost("verify-answers")]
        public async Task<ActionResult<GetLastAnswersResponse>> VerifyAnswers([FromBody] AnswerVerifyRequest answerVerifyRequest)
        {
            var publicUserId = User.FindFirst(ClaimTypes.NameIdentifier)!.Value;
            var canSeeInactiveContent = await authorizationService.CanSeeInactiveContentAsync(User);
            var result = await verifyAnswersUseCase.ExecuteAsync(answerVerifyRequest.PublicLessonId, answerVerifyRequest.UnityName, answerVerifyRequest.Answers, Guid.Parse(publicUserId), canSeeInactiveContent);

            return StatusCode((int)result.StatusCode, result.Content);
        }

        [EndpointSummary("Obter lista")]
        [EndpointDescription("Retorna uma lista de questões e alternativas com base no nome da aula e nome da unidade. Cada questão traz a última alternativa escolhida pelo usuário autenticado e se ela estava correta; esses campos vêm nulos quando a questão ainda não foi respondida. Aulas de unidades inativas só são encontradas por quem visualiza conteúdos para edição (content.read) ou gerencia conteúdos (content.manage).")]
        [ProducesResponseType<IEnumerable<QuestionDtoResponse>>(StatusCodes.Status200OK, Description = "Retorna a lista de questões daquela aula.")]
        [ProducesResponseType(StatusCodes.Status404NotFound, Description = "Quando a aula não existe ou a unidade dela está inativa e o usuário não visualiza nem gerencia conteúdos.")]
        [HttpGet("{unityName}/{lessonName}")]
        public async Task<ActionResult<IEnumerable<QuestionDtoResponse>>> GetList(string unityName, string lessonName)
        {
            var publicUserId = User.FindFirst(ClaimTypes.NameIdentifier)!.Value;
            var decodedUnityName = Uri.UnescapeDataString(unityName);
            var decodedLessonName = Uri.UnescapeDataString(lessonName);
            var canSeeInactiveContent = await authorizationService.CanSeeInactiveContentAsync(User);
            var result = await _getQuestionnaireUseCase.ExecuteAsync(decodedUnityName, decodedLessonName, Guid.Parse(publicUserId), canSeeInactiveContent);

            return StatusCode((int)result.StatusCode, result.Content);
        }
    }
}