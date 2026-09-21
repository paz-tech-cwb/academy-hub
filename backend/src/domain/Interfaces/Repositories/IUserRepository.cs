using domain.Models;

namespace domain.Interfaces.Repositories
{
    public interface IUserRepository : IBaseRepository<User>
    {
        public Task AddExperience(int experienceToAdd, Guid userId);
    }
}