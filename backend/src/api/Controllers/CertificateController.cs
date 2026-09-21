using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using api.Controllers.Responses;
using application.UseCases;
using domain.Interfaces.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [Route("api/certificate")]
    [ApiController]
    [Authorize]
    public class CertificateController(IssueCertificateUseCase issueCertificateUseCase, ICertificateRepository certificateRepository) : ControllerBase
    {
        [EndpointSummary("Emitir certificado")]
        [EndpointDescription("Verifica se todas as questões da respectiva unidade já foram respondidas e emite um certificado para o usuário.")]
        [ProducesResponseType<string>(StatusCodes.Status200OK, Description = "Quando o certificado é emitido com sucesso.")]
        [ProducesResponseType<string>(StatusCodes.Status400BadRequest, Description = "Quando ocorre algum erro na validação das questões")]
        [HttpPost("issue")]
        public async Task<ActionResult<string>> IssueNewCertificate([FromQuery][Required] string unityName)
        {
            var decodedUnityName = Uri.UnescapeDataString(unityName);
            var publicUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
            var result = await issueCertificateUseCase.ExecuteAsync(Guid.Parse(publicUserId), decodedUnityName);

            return StatusCode((int)result.StatusCode, result.Content);
        }

        [EndpointSummary("Obter lista")]
        [EndpointDescription("Retorna lista de certificados por usuário.")]
        [ProducesResponseType<List<CertificateGetAllResponse>>(StatusCodes.Status200OK)]
        [HttpGet]
        public async Task<List<CertificateGetAllResponse>> GetUserCertificates()
        {
            var publicUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;

            var certificates = await certificateRepository.GetCertificatesByUserId(Guid.Parse(publicUserId));

            return certificates.Select(c => new CertificateGetAllResponse
            {
                UnityName = c.Unity!.Name,
                CreatedAt = c.CreatedAt
            }).ToList();
        }
    }
}