using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using api.Controllers.Requests;
using application.Dtos;
using application.UseCases;
using domain.Entities;
using domain.Interfaces.Repositories;
using Microsoft.AspNetCore.Mvc;
using static System.Text.Encoding;

namespace api.Controllers
{
    [Route("api/user")]
    [ApiController]
    public class UsersController(IUserRepository userRepository, LoginUseCase loginUseCase, RegisterUseCase _useCase) : ControllerBase
    {   
        [EndpointSummary("Registro")]
        [EndpointDescription("Cria um novo usuário.")]
        [ProducesResponseType<string>(StatusCodes.Status201Created)]
        [HttpPost("register")]
        public async Task<ActionResult<string>> Register(RegisterRequest registerDto)
        {
            var result = await _useCase.ExecuteAsync(registerDto.Username, registerDto.Password);
            return StatusCode((int)result.StatusCode, result.Content);
        }

        [EndpointSummary("Login")]
        [EndpointDescription("Realiza login na API para obter token JWT.")]
        [ProducesResponseType<LoginResponseDto>(StatusCodes.Status200OK, Description = "Quando o login é realizado com sucesso.")]
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
    }
}

