using System.Net;
using application.Dtos;
using domain.Interfaces.Repositories;
using domain.Interfaces.Services;
using static BCrypt.Net.BCrypt;

namespace application.UseCases
{
    public class LoginUseCase(IUserRepository userRepository, IJwtService jwtService)
    {
        public async Task<UseCaseResult<LoginResponseDto>> ExecuteAsync(string username, string password)
        {
            var userFromDatabase = await userRepository.GetAsync(u => u.Username == username);

            if (userFromDatabase is null) return LoginInvalido();

            var passwordIsIncorrect = !Verify(password, userFromDatabase.Password);

            if (passwordIsIncorrect) return LoginInvalido();

            return new()
            {
                Content = new LoginResponseDto()
                {
                    IsLogged = true,
                    AccessToken = jwtService.GenerateBearerToken(userFromDatabase),
                    Username = userFromDatabase.Username,
                    ExpiresIn = jwtService.GetExpirationDate(),
                    Message = "Successfully logged."
                },
            };
        }

        private static UseCaseResult<LoginResponseDto> LoginInvalido() => new()
        {
            Content = new()
            {
                Message = "E-mail ou senha incorretos",
            },
            StatusCode = HttpStatusCode.Unauthorized
        };
    }
}
