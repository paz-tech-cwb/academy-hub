using System.Net;
using application.Dtos;
using domain.Interfaces.Repositories;
using domain.Models;
using static BCrypt.Net.BCrypt;

namespace application.UseCases
{
    public class RegisterUseCase(IUserRepository userRepository)
    {
        public async Task<UseCaseResult<string>> ExecuteAsync(string username, string password)
        {
            var userAlreadyExists = await userRepository.GetAsync(u => u.Username == username) != null;

            if (userAlreadyExists)
                return Conflict();
            
            await userRepository.InsertAsync(new User()
            {
                Username = username,
                Password = HashPassword(password),
                Status = true,
            });

            return Created();
        }

        private static UseCaseResult<string> Created() => new()
        {
            StatusCode = HttpStatusCode.Created,
            Content = "Usuário criado com sucesso."
        };

        private static UseCaseResult<string> Conflict() => new()
        {
            StatusCode = HttpStatusCode.Conflict,
            Content = "Usuário já existe."
        };
    }
}
