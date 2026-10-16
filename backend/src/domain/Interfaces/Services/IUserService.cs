using domain.Dtos;
using domain.Enums;

namespace domain.Interfaces.Services
{
    public interface IUserService
    {
        Task<PaginatedResult<UserListResponse>> GetUsersAsync(int page, int pageSize, string? search, bool? status, Guid? rolePublicId);
        Task<PaginatedResult<LeaderboardResponse>> GetLeaderboardAsync(int page, int pageSize);
        Task<bool> DeleteUserAsync(Guid publicId);
        Task<bool> ResetPasswordAsync(Guid publicId, string newPassword);
        Task<ChangePasswordResult> ChangeOwnPasswordAsync(Guid publicId, string currentPassword, string newPassword);
        Task<bool> DeactivateUserAsync(Guid publicId);
        Task<bool> UpdateUserAsync(Guid publicId, bool? status, Guid? rolePublicId);

        /// <summary>
        /// Busca os dados editáveis do perfil do próprio usuário.
        /// </summary>
        /// <param name="publicId">PublicId do usuário autenticado.</param>
        /// <returns>Os dados do perfil, ou <c>null</c> se o usuário não existir.</returns>
        Task<MyProfileResponse?> GetOwnProfileAsync(Guid publicId);

        /// <summary>
        /// Atualiza o "sobre mim", o Instagram e o e-mail do próprio usuário. Valores vazios ficam nulos.
        /// </summary>
        /// <param name="publicId">PublicId do usuário autenticado.</param>
        /// <param name="aboutMe">Texto de apresentação.</param>
        /// <param name="instagram">Identificador ou endereço do perfil no Instagram.</param>
        /// <param name="email">E-mail do usuário.</param>
        /// <returns><c>false</c> se o usuário não existir.</returns>
        Task<bool> UpdateOwnProfileAsync(Guid publicId, string? aboutMe, string? instagram, string? email);
    }
}
