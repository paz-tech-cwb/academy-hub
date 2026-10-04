using domain.Dtos;
using domain.Enums;
using domain.Interfaces.Repositories;
using domain.Interfaces.Services;
using domain.Models;
using static BCrypt.Net.BCrypt;

namespace infra.Services
{
    public class UserService(IUserRepository userRepository) : IUserService
    {
        public async Task<PaginatedResult<UserListResponse>> GetUsersAsync(int page, int pageSize, string? search, bool? status, Roles? role)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            var users = await userRepository.GetListAsync(u => true);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLowerInvariant();
                users = users.Where(u => u.Username.ToLowerInvariant().Contains(term)).ToList();
            }

            if (status.HasValue)
                users = users.Where(u => u.Status == status.Value).ToList();

            if (role.HasValue)
                users = users.Where(u => u.Role == role.Value).ToList();

            var totalCount = users.Count;
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            var items = users
                .OrderBy(u => u.Username)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new UserListResponse
                {
                    PublicId = u.PublicId,
                    Username = u.Username,
                    Experience = u.Experience,
                    Status = u.Status,
                    Role = u.Role
                })
                .ToList();

            return new PaginatedResult<UserListResponse>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages
            };
        }

        public async Task<bool> DeleteUserAsync(Guid publicId)
        {
            var user = await GetUserAsync(publicId);
            if (user is null) return false;

            await userRepository.DeleteAsync(user);
            return true;
        }

        public async Task<bool> ResetPasswordAsync(Guid publicId, string newPassword)
        {
            var user = await GetUserAsync(publicId);
            if (user is null) return false;

            user.Password = HashPassword(newPassword);
            await userRepository.UpdateAsync(user);
            return true;
        }

        public async Task<bool> DeactivateUserAsync(Guid publicId)
        {
            var user = await GetUserAsync(publicId);
            if (user is null) return false;

            user.Status = false;
            await userRepository.UpdateAsync(user);
            return true;
        }

        public async Task<bool> UpdateUserAsync(Guid publicId, bool? status, Roles? role)
        {
            var user = await GetUserAsync(publicId);
            if (user is null) return false;

            if (status.HasValue) user.Status = status.Value;
            if (role.HasValue) user.Role = role.Value;

            await userRepository.UpdateAsync(user);
            return true;
        }

        private async Task<User?> GetUserAsync(Guid publicId)
            => (await userRepository.GetListAsync(u => u.PublicId == publicId)).FirstOrDefault();
    }
}
