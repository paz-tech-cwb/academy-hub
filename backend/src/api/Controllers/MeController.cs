using api.Authorization;
using api.Controllers.Requests;
using application.Dtos;
using domain.Constants;
using domain.Enums;
using domain.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [Route("api/me")]
    [ApiController]
    [Authorize]
    [Tags("Permissões")]
    public class MeController(ICapabilityResolver capabilityResolver, IUserService userService) : ControllerBase
    {
        [EndpointSummary("Minhas funcionalidades")]
        [EndpointDescription("Retorna os códigos das funcionalidades liberadas para o usuário autenticado. O front usa essa lista para decidir quais cards de configuração exibir. Quem não tem nenhuma funcionalidade recebe uma lista vazia, e não um erro: é o estado de quem abre as configurações e não vê nenhum card.")]
        [ProducesResponseType<string[]>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized, Description = "Quando o usuário não está autenticado.")]
        [HttpGet("capabilities")]
        public async Task<ActionResult<string[]>> GetCapabilities()
        {
            // Da constante, e não do banco: assim a tela de configurações de um
            // Admin não colapsa a zero cards se a tabela estiver vazia ou
            // inacessível.
            if (User.IsPlatformAdmin()) return Ok(Capabilities.All);

            if (!User.TryGetUserPublicId(out var userPublicId)) return Ok(Array.Empty<string>());

            var capabilities = await capabilityResolver.ResolveAsync(userPublicId);

            return Ok(capabilities.ToArray());
        }

        [Tags("Perfil")]
        [EndpointSummary("Trocar minha senha")]
        [EndpointDescription("Troca a senha do próprio usuário autenticado. Disponível para qualquer usuário autenticado, sem exigir funcionalidade nenhuma — diferente de PUT /api/user/{publicId}/password, que é a redefinição feita por um Admin. Exige a senha atual: o token fica no navegador por 24h, então sem essa confirmação um token vazado bastaria para tomar a conta. O usuário continua com o mesmo token depois da troca.")]
        [ProducesResponseType(StatusCodes.Status204NoContent, Description = "Quando a senha é alterada.")]
        [ProducesResponseType<MessageResponse>(StatusCodes.Status400BadRequest, Description = "Quando a senha atual está incorreta ou a nova senha é inválida.")]
        [ProducesResponseType(StatusCodes.Status401Unauthorized, Description = "Quando o usuário não está autenticado.")]
        [ProducesResponseType(StatusCodes.Status404NotFound, Description = "Quando o usuário do token não existe mais.")]
        [HttpPut("password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            if (!User.TryGetUserPublicId(out var userPublicId)) return Unauthorized();

            var result = await userService.ChangeOwnPasswordAsync(
                userPublicId,
                request.CurrentPassword,
                request.NewPassword);

            return result switch
            {
                ChangePasswordResult.Success => NoContent(),
                ChangePasswordResult.InvalidCurrentPassword
                    => BadRequest(new MessageResponse { Message = "A senha atual está incorreta." }),
                _ => NotFound()
            };
        }
    }
}
