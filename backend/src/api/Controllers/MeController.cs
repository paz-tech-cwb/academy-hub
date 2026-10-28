using api.Authorization;
using api.Controllers.Requests;
using application.Dtos;
using application.Services;
using application.UseCases;
using domain.Constants;
using domain.Dtos;
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
    public class MeController(
        ICapabilityResolver capabilityResolver,
        UserService userService,
        GetMyProgressUseCase getMyProgressUseCase) : ControllerBase
    {
        /// <summary>
        /// Limite do corpo da requisição de upload. Fica acima dos 2 MB da imagem para que arquivos um
        /// pouco maiores cheguem ao use case e recebam uma mensagem clara, em vez de um 413 sem corpo.
        /// </summary>
        private const long UploadRequestLimit = 5 * 1024 * 1024;

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

        [Tags("Progresso")]
        [EndpointSummary("Meu progresso")]
        [EndpointDescription("Retorna o progresso do usuário autenticado em cada unidade ativa: total de aulas, aulas concluídas, a próxima aula a fazer e a data da última resposta. Uma aula conta como concluída quando a última resposta de cada questão respondida está correta, a mesma regra do detalhe da aula. A home usa esses dados para mostrar o progresso e o \"continuar de onde parou\".")]
        [ProducesResponseType<List<UnityProgressResponse>>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized, Description = "Quando o usuário não está autenticado.")]
        [ProducesResponseType(StatusCodes.Status404NotFound, Description = "Quando o usuário do token não existe mais.")]
        [HttpGet("progress")]
        public async Task<ActionResult<List<UnityProgressResponse>>> GetProgress()
        {
            if (!User.TryGetUserPublicId(out var userPublicId)) return Unauthorized();

            var result = await getMyProgressUseCase.ExecuteAsync(userPublicId);
            return StatusCode((int)result.StatusCode, result.Content);
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

        /// <summary>
        /// Retorna os dados editáveis do perfil do usuário autenticado.
        /// </summary>
        /// <returns>Foto, "sobre mim", Instagram e e-mail do usuário.</returns>
        [Tags("Perfil")]
        [EndpointSummary("Meu perfil")]
        [EndpointDescription("Retorna os dados que o próprio usuário pode editar no perfil. Inclui o e-mail, que não aparece no perfil público (GET /api/user/{username}).")]
        [ProducesResponseType<MyProfileResponse>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized, Description = "Quando o usuário não está autenticado.")]
        [ProducesResponseType(StatusCodes.Status404NotFound, Description = "Quando o usuário do token não existe mais.")]
        [HttpGet("profile")]
        public async Task<ActionResult<MyProfileResponse>> GetProfile()
        {
            if (!User.TryGetUserPublicId(out var userPublicId)) return Unauthorized();

            var profile = await userService.GetOwnProfileAsync(userPublicId);
            return profile is null ? NotFound() : Ok(profile);
        }

        /// <summary>
        /// Atualiza o "sobre mim", o Instagram e o e-mail do usuário autenticado.
        /// </summary>
        /// <param name="request">Novos valores; vazios ou nulos limpam o campo.</param>
        /// <returns>204 em caso de sucesso.</returns>
        [Tags("Perfil")]
        [EndpointSummary("Atualizar meu perfil")]
        [EndpointDescription("Substitui o \"sobre mim\", o Instagram e o e-mail do próprio usuário. Campo vazio ou nulo fica sem valor, então o front deve sempre enviar os três. A foto de perfil tem rotas próprias em /api/me/profile-pic.")]
        [ProducesResponseType(StatusCodes.Status204NoContent, Description = "Quando o perfil é atualizado.")]
        [ProducesResponseType(StatusCodes.Status400BadRequest, Description = "Quando o e-mail é inválido ou algum campo passa do tamanho máximo.")]
        [ProducesResponseType(StatusCodes.Status401Unauthorized, Description = "Quando o usuário não está autenticado.")]
        [ProducesResponseType(StatusCodes.Status404NotFound, Description = "Quando o usuário do token não existe mais.")]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateMyProfileRequest request)
        {
            if (!User.TryGetUserPublicId(out var userPublicId)) return Unauthorized();

            var found = await userService.UpdateOwnProfileAsync(userPublicId, request.AboutMe, request.Instagram, request.Email);
            return found ? NoContent() : NotFound();
        }

        /// <summary>
        /// Recebe a foto de perfil já recortada em quadrado e grava no bucket.
        /// </summary>
        /// <param name="file">Arquivo PNG, JPG ou WebP de até 2 MB.</param>
        /// <returns>A nova URL da foto, ou o motivo da recusa.</returns>
        [Tags("Perfil")]
        [EndpointSummary("Enviar foto de perfil")]
        [EndpointDescription("Recebe um arquivo PNG, JPG ou WebP de até 2 MB, já quadrado, e grava no bucket em profile-pics/{publicId}.{ext}, substituindo a foto anterior. Imagens maiores que 512x512 são reduzidas. A URL retornada leva ?v= para não reaproveitar o cache da foto anterior.")]
        [ProducesResponseType<ProfilePicResponse>(StatusCodes.Status200OK)]
        [ProducesResponseType<MessageResponse>(StatusCodes.Status400BadRequest, Description = "Arquivo ausente, maior que 2 MB, em formato não aceito ou que não é quadrado.")]
        [ProducesResponseType(StatusCodes.Status401Unauthorized, Description = "Quando o usuário não está autenticado.")]
        [ProducesResponseType(StatusCodes.Status404NotFound, Description = "Quando o usuário do token não existe mais.")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(UploadRequestLimit)]
        [RequestFormLimits(MultipartBodyLengthLimit = UploadRequestLimit)]
        [HttpPut("profile-pic")]
        public async Task<IActionResult> UploadProfilePic(IFormFile? file)
        {
            if (!User.TryGetUserPublicId(out var userPublicId)) return Unauthorized();

            if (file is null || file.Length == 0)
                return BadRequest(new MessageResponse { Message = "Selecione uma imagem para enviar." });

            using var buffer = new MemoryStream();
            await file.CopyToAsync(buffer);

            var result = await userService.UploadProfilePicAsync(userPublicId, buffer.ToArray());
            return StatusCode((int)result.StatusCode, result.Content);
        }

        /// <summary>
        /// Baixa a imagem de uma URL, recorta na área quadrada informada e grava no bucket como foto de perfil.
        /// </summary>
        /// <param name="request">URL da imagem e área de recorte.</param>
        /// <returns>A nova URL da foto, ou o motivo da recusa.</returns>
        [Tags("Perfil")]
        [EndpointSummary("Definir foto de perfil (URL)")]
        [EndpointDescription("A API baixa a imagem (PNG, JPG ou WebP de até 10 MB; endereços internos são recusados), recorta na área informada em pixels da imagem original — que deve ser quadrada —, reduz para no máximo 512x512 e grava no bucket em profile-pics/, substituindo a foto anterior. Se um PNG recortado passar de 2 MB, ele é gravado como WebP.")]
        [ProducesResponseType<ProfilePicResponse>(StatusCodes.Status200OK)]
        [ProducesResponseType<MessageResponse>(StatusCodes.Status400BadRequest, Description = "URL inválida ou inacessível, imagem em formato não aceito, recorte fora da imagem ou não quadrado, ou resultado maior que 2 MB.")]
        [ProducesResponseType(StatusCodes.Status401Unauthorized, Description = "Quando o usuário não está autenticado.")]
        [ProducesResponseType(StatusCodes.Status404NotFound, Description = "Quando o usuário do token não existe mais.")]
        [HttpPut("profile-pic/url")]
        public async Task<IActionResult> SetProfilePicFromUrl([FromBody] SetProfilePicFromUrlRequest request)
        {
            if (!User.TryGetUserPublicId(out var userPublicId)) return Unauthorized();

            var crop = new ImageCrop(request.CropX, request.CropY, request.CropWidth, request.CropHeight);
            var result = await userService.SetProfilePicFromUrlAsync(userPublicId, new Uri(request.Url), crop);
            return StatusCode((int)result.StatusCode, result.Content);
        }

        /// <summary>
        /// Remove a foto de perfil do usuário autenticado.
        /// </summary>
        /// <returns>204 em caso de sucesso.</returns>
        [Tags("Perfil")]
        [EndpointSummary("Remover foto de perfil")]
        [EndpointDescription("Apaga o arquivo da foto no bucket e deixa o usuário sem foto. Fotos que são URLs externas, e não arquivos do bucket, só são desvinculadas. Usuários sem foto também recebem 204.")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized, Description = "Quando o usuário não está autenticado.")]
        [ProducesResponseType(StatusCodes.Status404NotFound, Description = "Quando o usuário do token não existe mais.")]
        [HttpDelete("profile-pic")]
        public async Task<IActionResult> RemoveProfilePic()
        {
            if (!User.TryGetUserPublicId(out var userPublicId)) return Unauthorized();

            var result = await userService.RemoveProfilePicAsync(userPublicId);
            return StatusCode((int)result.StatusCode);
        }
    }
}
