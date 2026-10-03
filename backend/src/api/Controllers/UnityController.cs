using System.Security.Claims;
using application.UseCases;
using application.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using api.Controllers.Requests;
using domain.Interfaces.Repositories;
using domain.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[Route("api/unity")]
[ApiController]
[Authorize]
public class UnityController(GetUnitiesUseCase getUnitiesUseCase, GetUnityUseCase getUnityUseCase, CreateUnityUseCase createUnityUseCase, IUnityRepository unityRepository, DeleteUnityUseCase deleteUnityUseCase) : ControllerBase
{
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
}
