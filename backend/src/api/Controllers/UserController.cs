using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using api.Controllers.Requests;
using application.Dtos;
using application.UseCases;
using domain.Dtos;
using domain.Entities;
using domain.Interfaces.Repositories;
using domain.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using static System.Text.Encoding;

namespace api.Controllers
{
    [Route("api/user")]
    [ApiController]
    public class UserController(IUserRepository userRepository, LoginUseCase loginUseCase, RegisterUseCase _useCase, IUserService userService) : ControllerBase
    {   
        [EndpointSummary("Registro")]
        [EndpointDescription("Cria um novo usuário.")]
        [ProducesResponseType<string>(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest, Description = "Quando o username ou a senha são inválidos.")]
        [HttpPost("register")]
        public async Task<ActionResult<string>> Register(RegisterRequest registerDto)
        {
            var result = await _useCase.ExecuteAsync(registerDto.Username, registerDto.Password);
            return StatusCode((int)result.StatusCode, result.Content);
        }

        [EndpointSummary("Login")]
        [EndpointDescription("Realiza login na API para obter token JWT.")]
        [ProducesResponseType<LoginResponseDto>(StatusCodes.Status200OK, Description = "Quando o login é realizado com sucesso.")]
        [ProducesResponseType<LoginResponseDto>(StatusCodes.Status400BadRequest, Description = "Quando o username ou a senha são inválidos.")]
        [ProducesResponseType<LoginResponseDto>(StatusCodes.Status401Unauthorized, Description = "Quando a senha ou usuário estão incorretos.")]
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login(LoginRequest loginDto)
        {
            var result = await loginUseCase.ExecuteAsync(loginDto.Username, loginDto.Password);
            return StatusCode((int)result.StatusCode, result.Content);
        }

        [EndpointSummary("Obter perfil")]
        [EndpointDescription("Retorna os dados públicos de qualquer usuário solicitado.")]
        [ProducesResponseType<Profile>(StatusCodes.Status200OK, Description = "Quando o usuário é encontrado.")]
        [ProducesResponseType(StatusCodes.Status204NoContent, Description = "Quando o usuário não é encontrado.")]
        [HttpGet("{username}")]
        public async Task<ActionResult<Profile>> Profile([FromRoute][Required][Description("Nome de usuário que deseja buscar.")] string username)
        {
            var user = await userRepository.GetAsync(u => u.Username == username);

            if (user is null) return NoContent();

            return Ok(new Profile
            {
                PublicId = user.PublicId,
                Experience = user.Experience,
                Username = user.Username,
                Role = user.Role
            });
        }

        [Authorize(Roles = "Admin")]
        [EndpointSummary("Listar usuários")]
        [EndpointDescription("Busca usuários com paginação e filtros opcionais por username, status e role.")]
        [ProducesResponseType<PaginatedResult<UserListResponse>>(StatusCodes.Status200OK)]
        [HttpGet]
        public async Task<ActionResult<PaginatedResult<UserListResponse>>> GetUsers(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery][Description("Filtra pelo username (contém).")] string? search = null,
            [FromQuery][Description("Filtra pelo status (ativo/inativo).")] bool? status = null,
            [FromQuery][Description("Filtra pela role.")] domain.Enums.Roles? role = null)
        {
            var result = await userService.GetUsersAsync(page, pageSize, search, status, role);
            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [EndpointSummary("Atualizar usuário")]
        [EndpointDescription("Atualiza status e/ou role do usuário.")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [HttpPut("{publicId}")]
        public async Task<IActionResult> UpdateUser(Guid publicId, [FromBody] UpdateUserRequest request)
        {
            var found = await userService.UpdateUserAsync(publicId, request.Status, request.Role);
            return found ? NoContent() : NotFound();
        }

        [Authorize(Roles = "Admin")]
        [EndpointSummary("Redefinir senha")]
        [EndpointDescription("Redefine uma nova senha para um usuário.")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [HttpPut("{publicId}/password")]
        public async Task<IActionResult> ResetPassword(Guid publicId, [FromBody] ResetPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.NewPassword)) return BadRequest();

            var found = await userService.ResetPasswordAsync(publicId, request.NewPassword);
            return found ? NoContent() : NotFound();
        }

        [Authorize(Roles = "Admin")]
        [EndpointSummary("Inativar usuário")]
        [EndpointDescription("Inativa um usuário.")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [HttpPatch("{publicId}/deactivate")]
        public async Task<IActionResult> DeactivateUser(Guid publicId)
        {
            var found = await userService.DeactivateUserAsync(publicId);
            return found ? NoContent() : NotFound();
        }

        [Authorize(Roles = "Admin")]
        [EndpointSummary("Excluir usuário")]
        [EndpointDescription("Deleta um usuário por id.")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [HttpDelete("{publicId}")]
        public async Task<IActionResult> DeleteUser(Guid publicId)
        {
            var found = await userService.DeleteUserAsync(publicId);
            return found ? NoContent() : NotFound();
        }
    }
}
