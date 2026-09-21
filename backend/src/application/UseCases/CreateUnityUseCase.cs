using System.Net;
using application.Dtos;
using domain.Interfaces.Repositories;
using domain.Models;

namespace application.UseCases
{
    public class CreateUnityUseCase(IUnityRepository unityRepository)
    {
        public async Task<UseCaseResult<Unity>> ExecuteAsync(string name, string? description)
        {
            var nameExists = await unityRepository.GetAsync(u => u.Name == name);
            if (nameExists is not null)
                return new() { StatusCode = HttpStatusCode.BadRequest };

            var unity = await unityRepository.InsertAsync(new Unity
            {
                Name = name,
                Description = description
            });

            return new() { Content = unity, StatusCode = HttpStatusCode.Created };
        }
    }
}