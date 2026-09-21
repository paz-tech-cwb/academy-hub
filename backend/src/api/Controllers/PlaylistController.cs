using application.UseCases;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[Route("api/playlist")]
[ApiController]
[Authorize]
public class PlaylistController(ImportPlaylistUseCase importPlaylistUseCase) : ControllerBase
{
    [HttpPost("import/{playlistUrl}")]
    public async Task<ActionResult> ImportFromYoutube(string playlistUrl)
    {
        var result = await importPlaylistUseCase.ExecuteAsync(playlistUrl);
        return StatusCode((int)result.StatusCode, result.Content);
    }
}
