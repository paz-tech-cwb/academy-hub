using application.Dtos;
using domain.Interfaces.Repositories;

namespace application.UseCases
{
    public class GetUnitiesUseCase(IUnityRepository unityRepository)
    {
        public async Task<UseCaseResult<List<GetUnitiesResponse>>> ExecuteAsync()
        {
            var unities = await unityRepository.GetListAsync(u => true);

            var responses = unities.Select(unity => new GetUnitiesResponse
            {
                PublicId = unity.PublicId,
                Name = unity.Name,
                Description = unity.Description,
                UnityCover = unity.CoverUrl
            }).ToList();

            return new() { Content = responses };
        }
    }
}
