using System.Linq.Expressions;
using domain.Interfaces.Repositories;
using domain.Models;
using Microsoft.EntityFrameworkCore;

namespace infra.Repositories
{
    internal class UserRepository(AppDbContext context) : BaseRepository<User>(context), IUserRepository
    {
        public override async Task<User?> GetAsync(Expression<Func<User, bool>> filter)
        {
            var user = await context.Users.FirstOrDefaultAsync(filter);

            if (user is null) return null;
            if (user.Status == false) return null;

            return user;
        }

        public async Task AddExperience(int experienceToAdd, Guid publicId)
        {
            var user = context.Users.First(u => u.PublicId == publicId);
            user.Experience += experienceToAdd;

            context.Update(user);
            await context.SaveChangesAsync();
        }
    }
}
