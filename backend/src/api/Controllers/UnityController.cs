using System.Security.Claims;
using application.UseCases;
using application.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using api.Controllers.Requests;
using domain.Constants;
using domain.Dtos;
using domain.Interfaces.Repositories;
using domain.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[Route("api/unity")]
[ApiController]
[Authorize]
public class UnityController(
    GetUnitiesUseCase getUnitiesUseCase,
    GetUnityUseCase getUnityUseCase,
    CreateUnityUseCase createUnityUseCase,
    IUnityRepository unityRepository,
    DeleteUnityUseCase deleteUnityUseCase,
    UploadUnityCoverUseCase uploadUnityCoverUseCase,
    SetUnityCoverFromUrlUseCase setUnityCoverFromUrlUseCase,
    RemoveUnityCoverUseCase removeUnityCoverUseCase) : ControllerBase
{
    /// <summary>
    /// Limite do corpo da requisição de upload. Fica acima dos 2 MB da imagem para que arquivos um
    /// pouco maiores cheguem ao use case e recebam uma mensagem clara, em vez de um 413 sem corpo.
    /// </summary>
    private const long UploadRequestLimit = 5 * 1024 * 1024;

    [EndpointSummary("Obter lista")]
    [EndpointDescription("Retorna todas as unidades")]
    [ProducesResponseType<List<GetUnitiesResponse>>(StatusCodes.Status200OK)]
    [HttpGet]
    public async Task<List<GetUnitiesResponse>> GetAll()
    {
        var result = await getUnitiesUseCase.ExecuteAsync();
        return result.Content!;
    }

    [EndpointSummary("Obter único")]
    [EndpointDescription("Retorna uma única unidade")]
    [ProducesResponseType<UnityResponseDto>(StatusCodes.Status200OK, Description = "Quando a unidade é encontrada.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "Quando a unidade não é encontrada.")]
    [HttpGet("{unityName}")]
    public async Task<ActionResult<UnityResponseDto>> Get(string unityName)
    {
        var decodedUnityName = Uri.UnescapeDataString(unityName);
        var publicUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
        var result = await getUnityUseCase.ExecuteAsync(decodedUnityName, Guid.Parse(publicUserId));
        return StatusCode((int)result.StatusCode, result.Content);
    }

    [Authorize(Roles = "Admin")]
    [EndpointSummary("Criar unidade")]
    [EndpointDescription("Valida a unicidade do nome e cria uma nova unidade.")]
    [ProducesResponseType<Unity>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [HttpPost]
    public async Task<ActionResult<Unity>> Create([FromBody] CreateUnityRequest request)
    {
        var result = await createUnityUseCase.ExecuteAsync(request.Name, request.Description);
        return StatusCode((int)result.StatusCode, result.Content);
    }

    [Authorize(Roles = "Admin")]
    [EndpointSummary("Atualizar unidade")]
    [EndpointDescription("Atualiza nome e descrição de uma unidade existente, referenciada pelo publicId.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [HttpPut("{publicId}")]
    public async Task<IActionResult> Update(Guid publicId, [FromBody] UpdateUnityRequest request)
    {
        var unity = await unityRepository.GetAsync(u => u.PublicId == publicId);
        if (unity is null) return NotFound();

        unity.Name = request.Name;
        unity.Description = request.Description;

        try
        {
            await unityRepository.UpdateAsync(unity);
        }
        catch (DbUpdateException)
        {
            return BadRequest();
        }

        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [EndpointSummary("Excluir unidade")]
    [EndpointDescription("Remove a unidade e tudo que dela depende (aulas, questões, alternativas, respostas e certificados) em cascata.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [HttpDelete("{publicId}")]
    public async Task<IActionResult> Delete(Guid publicId)
    {
        var result = await deleteUnityUseCase.ExecuteAsync(publicId);
        return StatusCode((int)result.StatusCode);
    }

    /// <summary>
    /// Recebe a imagem de capa já recortada em 16:9 e grava no bucket como capa da unidade.
    /// </summary>
    /// <param name="publicId">PublicId da unidade.</param>
    /// <param name="file">Arquivo PNG, JPG ou WebP de até 2 MB.</param>
    /// <returns>A nova URL da capa, ou o motivo da recusa.</returns>
    [Authorize(Policy = Capabilities.ContentManage)]
    [Tags("Unidades")]
    [EndpointSummary("Enviar capa da unidade")]
    [EndpointDescription("Recebe um arquivo PNG, JPG ou WebP de até 2 MB, já na proporção 16:9, e grava no bucket em unities/{publicId}.{ext}, substituindo a capa anterior. Imagens maiores que 1920x1080 são reduzidas. A URL retornada leva ?v= para não reaproveitar o cache da capa anterior.")]
    [ProducesResponseType<UnityCoverResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status400BadRequest, Description = "Arquivo ausente, maior que 2 MB, em formato não aceito ou fora da proporção 16:9.")]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(UploadRequestLimit)]
    [RequestFormLimits(MultipartBodyLengthLimit = UploadRequestLimit)]
    [HttpPut("{publicId:guid}/cover")]
    public async Task<IActionResult> UploadCover(Guid publicId, IFormFile? file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new MessageResponse { Message = "Selecione uma imagem para enviar." });

        using var buffer = new MemoryStream();
        await file.CopyToAsync(buffer);

        var result = await uploadUnityCoverUseCase.ExecuteAsync(publicId, buffer.ToArray());
        return StatusCode((int)result.StatusCode, result.Content);
    }

    /// <summary>
    /// Baixa a imagem de uma URL, recorta na área informada e grava no bucket como capa da unidade.
    /// </summary>
    /// <param name="publicId">PublicId da unidade.</param>
    /// <param name="request">URL da imagem e área de recorte.</param>
    /// <returns>A nova URL da capa, ou o motivo da recusa.</returns>
    [Authorize(Policy = Capabilities.ContentManage)]
    [Tags("Unidades")]
    [EndpointSummary("Definir capa da unidade (URL)")]
    [EndpointDescription("A API baixa a imagem (PNG, JPG ou WebP de até 10 MB; endereços internos são recusados), recorta na área informada em pixels da imagem original — que deve estar em 16:9 —, reduz para no máximo 1920x1080 e grava no bucket, substituindo a capa anterior. Se um PNG recortado passar de 2 MB, ele é gravado como WebP.")]
    [ProducesResponseType<UnityCoverResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status400BadRequest, Description = "URL inválida ou inacessível, imagem em formato não aceito, recorte fora da imagem ou fora de 16:9, ou resultado maior que 2 MB.")]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [HttpPut("{publicId:guid}/cover/url")]
    public async Task<IActionResult> SetCoverFromUrl(Guid publicId, [FromBody] SetUnityCoverFromUrlRequest request)
    {
        var crop = new ImageCrop(request.CropX, request.CropY, request.CropWidth, request.CropHeight);
        var result = await setUnityCoverFromUrlUseCase.ExecuteAsync(publicId, new Uri(request.Url), crop);
        return StatusCode((int)result.StatusCode, result.Content);
    }

    /// <summary>
    /// Remove a capa da unidade do bucket e limpa a URL gravada no banco.
    /// </summary>
    /// <param name="publicId">PublicId da unidade.</param>
    /// <returns>204 em caso de sucesso ou 404 se a unidade não existir.</returns>
    [Authorize(Policy = Capabilities.ContentManage)]
    [Tags("Unidades")]
    [EndpointSummary("Remover capa da unidade")]
    [EndpointDescription("Apaga o arquivo da capa no bucket e deixa a unidade sem capa. Unidades que já não têm capa também retornam 204.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [HttpDelete("{publicId:guid}/cover")]
    public async Task<IActionResult> RemoveCover(Guid publicId)
    {
        var result = await removeUnityCoverUseCase.ExecuteAsync(publicId);
        return StatusCode((int)result.StatusCode);
    }
}
