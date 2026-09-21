using domain.Models;

namespace domain.Interfaces.Services
{
    public interface IJwtService
    {
        public string GenerateBearerToken(User user);
        public DateTime GetExpirationDate();
    }
}