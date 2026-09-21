using application.Dtos;
using domain.Interfaces.Repositories;
using domain.Interfaces.Services;

namespace application.UseCases
{
    public class GetUnitiesUseCase(IUnityRepository unityRepository, IStorageClient storageClient)
    {
        public async Task<UseCaseResult<List<GetUnitiesResponse>>> ExecuteAsync()
        {
            var unities = await unityRepository.GetListAsync(u => true);

            var responses = (await Task.WhenAll(unities.Select(async unity =>
            {
                var fileName = $"{unity.PublicId}.png";
                var imageUrl = await storageClient.FileExistsAsync("unity", fileName);
                var imageExists = !string.IsNullOrEmpty(imageUrl);
                return new GetUnitiesResponse
                {
                    PublicId = unity.PublicId,
                    Name = unity.Name,
                    Description = unity.Description,
                    UnityCover = imageExists ? imageUrl : null
                };
            }))).ToList();

            return new() { Content = responses };
        }
    }
}
