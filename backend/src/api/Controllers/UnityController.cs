using System.Security.Claims;
using application.UseCases;
using application.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[Route("api/unity")]
[ApiController]
[Authorize]
public class UnityController(GetUnitiesUseCase getUnitiesUseCase, GetUnityUseCase getUnityUseCase) : ControllerBase
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
}
