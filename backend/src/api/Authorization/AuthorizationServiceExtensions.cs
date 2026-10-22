using System.Security.Claims;
using domain.Constants;
using Microsoft.AspNetCore.Authorization;

namespace api.Authorization
{
    public static class AuthorizationServiceExtensions
    {
        /// <summary>
        /// Indica se o usuário pode encontrar unidades inativas e as aulas delas, o que vale para quem
        /// visualiza conteúdos para edição ou gerencia conteúdos. Admins sempre têm essas permissões.
        /// </summary>
        /// <param name="authorizationService">Serviço de autorização da requisição.</param>
        /// <param name="user">Usuário autenticado.</param>
        /// <returns><c>true</c> quando o usuário pode ver conteúdos inativos.</returns>
        public static async Task<bool> CanSeeInactiveContentAsync(this IAuthorizationService authorizationService, ClaimsPrincipal user)
            => (await authorizationService.AuthorizeAsync(user, Capabilities.ContentRead)).Succeeded
                || (await authorizationService.AuthorizeAsync(user, Capabilities.ContentManage)).Succeeded;
    }
}
