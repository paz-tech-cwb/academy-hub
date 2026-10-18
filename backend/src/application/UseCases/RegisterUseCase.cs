using System.Net;
using application.Dtos;
using domain.Enums;
using domain.Interfaces.Repositories;
using domain.Interfaces.Services;
using domain.Models;
using static BCrypt.Net.BCrypt;

namespace application.UseCases
{
    public class RegisterUseCase(IUserRepository userRepository, IJwtService jwtService)
    {
        /// <summary>
        /// Cria um novo usuário e já gera o token de acesso, para que ele entre sem precisar fazer login.
        /// </summary>
        /// <param name="username">Nome de usuário desejado; é normalizado para minúsculas.</param>
        /// <param name="password">Senha em texto plano, armazenada como hash.</param>
        /// <returns>201 com o token de acesso, ou 409 quando o username já está em uso.</returns>
        public async Task<UseCaseResult<LoginResponseDto>> ExecuteAsync(string username, string password)
        {
            var normalizedUsername = username.ToLower();

            var userAlreadyExists = await userRepository.GetAsync(u => u.Username == normalizedUsername) != null;

            if (userAlreadyExists)
                return Conflict();

            var user = await userRepository.InsertAsync(new User()
            {
                Username = normalizedUsername,
                Password = HashPassword(password),
                Status = true,
                Role = Roles.User,
            });

            return new()
            {
                StatusCode = HttpStatusCode.Created,
                Content = new LoginResponseDto()
                {
                    IsLogged = true,
                    AccessToken = jwtService.GenerateBearerToken(user),
                    Username = user.Username,
                    ExpiresIn = jwtService.GetExpirationDate(),
                    Message = "Usuário criado com sucesso."
                },
            };
        }

        private static UseCaseResult<LoginResponseDto> Conflict() => new()
        {
            StatusCode = HttpStatusCode.Conflict,
            Content = new() { Message = "Usuário já existe." }
        };
    }
}
