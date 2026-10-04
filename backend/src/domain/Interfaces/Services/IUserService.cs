using domain.Dtos;
using domain.Enums;

namespace domain.Interfaces.Services
{
    public interface IUserService
    {
        Task<PaginatedResult<UserListResponse>> GetUsersAsync(int page, int pageSize, string? search, bool? status, Roles? role);
        Task<bool> DeleteUserAsync(Guid publicId);
        Task<bool> ResetPasswordAsync(Guid publicId, string newPassword);
        Task<bool> DeactivateUserAsync(Guid publicId);
        Task<bool> UpdateUserAsync(Guid publicId, bool? status, Roles? role);
    }
}
