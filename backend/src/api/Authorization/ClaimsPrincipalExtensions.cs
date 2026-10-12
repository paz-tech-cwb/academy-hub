using System.Security.Claims;
using domain.Enums;

namespace api.Authorization
{
    public static class ClaimsPrincipalExtensions
    {
        /// <summary>
        /// Lê a role do claim do JWT, que o <c>JwtService</c> grava como
        /// <c>user.Role.ToString()</c> — o mesmo motivo pelo qual
        /// <c>[Authorize(Roles = "Admin")]</c> funciona.
        /// </summary>
        public static bool IsPlatformAdmin(this ClaimsPrincipal principal)
            => principal.IsInRole(nameof(Roles.Admin));

        public static bool TryGetUserPublicId(this ClaimsPrincipal principal, out Guid publicId)
            => Guid.TryParse(principal.FindFirst(ClaimTypes.NameIdentifier)?.Value, out publicId);
    }
}
