using System.Net;
using application.Dtos;
using application.Services;
using domain.Interfaces.Repositories;

namespace application.UseCases
{
    public class RemoveUnityCoverUseCase(IUnityRepository unityRepository, UnityCoverService unityCoverService)
    {
        /// <summary>
        /// Remove a capa da unidade do bucket e deixa <c>cover_url</c> nula. Unidades sem capa
        /// também retornam sucesso.
        /// </summary>
        /// <param name="publicId">PublicId da unidade.</param>
        /// <returns>204 em caso de sucesso ou 404 se a unidade não existir.</returns>
        public async Task<UseCaseResult<object>> ExecuteAsync(Guid publicId)
        {
            var unity = await unityRepository.GetAsync(u => u.PublicId == publicId);
            if (unity is null) return new() { StatusCode = HttpStatusCode.NotFound };

            await unityCoverService.RemoveAsync(unity);
            return new() { StatusCode = HttpStatusCode.NoContent };
        }
    }
}
