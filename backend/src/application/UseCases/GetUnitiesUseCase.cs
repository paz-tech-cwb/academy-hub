using application.Dtos;
using domain.Interfaces.Repositories;

namespace application.UseCases
{
    public class GetUnitiesUseCase(IUnityRepository unityRepository)
    {
        /// <summary>
        /// Lista as unidades cadastradas.
        /// </summary>
        /// <param name="includeInactive">Quando <c>true</c>, inclui as unidades inativas; caso contrário, retorna só as ativas.</param>
        /// <returns>As unidades encontradas.</returns>
        public async Task<UseCaseResult<List<GetUnitiesResponse>>> ExecuteAsync(bool includeInactive)
        {
            var unities = await unityRepository.GetListAsync(u => includeInactive || u.IsActive);

            var responses = unities.Select(unity => new GetUnitiesResponse
            {
                PublicId = unity.PublicId,
                Name = unity.Name,
                Description = unity.Description,
                UnityCover = unity.CoverUrl,
                IsActive = unity.IsActive
            }).ToList();

            return new() { Content = responses };
        }
    }
}
