using System.Net;
using application.Dtos;
using application.Services;
using domain.Interfaces.Repositories;

namespace application.UseCases
{
    public class RemoveProfilePicUseCase(IUserRepository userRepository, ProfilePicService profilePicService)
    {
        /// <summary>
        /// Remove a foto de perfil do usuário e deixa <c>profile_pic_url</c> nula. Usuários sem
        /// foto também retornam sucesso.
        /// </summary>
        /// <param name="userPublicId">PublicId do usuário.</param>
        /// <returns>204 em caso de sucesso ou 404 se o usuário não existir.</returns>
        public async Task<UseCaseResult<object>> ExecuteAsync(Guid userPublicId)
        {
            var user = await userRepository.GetAsync(u => u.PublicId == userPublicId);
            if (user is null) return new() { StatusCode = HttpStatusCode.NotFound };

            await profilePicService.RemoveAsync(user);
            return new() { StatusCode = HttpStatusCode.NoContent };
        }
    }
}
