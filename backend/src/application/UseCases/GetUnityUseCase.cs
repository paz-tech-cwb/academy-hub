using System.Net;
using application.Dtos;
using domain.Interfaces.Repositories;
using domain.Interfaces.Services;

namespace application.UseCases
{
    public class GetUnityUseCase(IUnityRepository unityRepository, ICertificateRepository certificateRepository, IQuestionService questionService)
    {
        public async Task<UseCaseResult<UnityResponseDto>> ExecuteAsync(string unityName, Guid publicUserId)
        {
            var unity = await unityRepository.GetAsync(u => u.Name == unityName);
            if (unity is null) return new() { StatusCode = HttpStatusCode.NoContent };

            var certificate = await certificateRepository.GetAsync(c => c.User!.PublicId == publicUserId && c.Unity!.PublicId == unity.PublicId);

            return new()
            {
                Content = new UnityResponseDto
                {
                    PublicId = unity.PublicId,
                    Description = unity.Description,
                    Name = unity.Name,
                    WasCertificateAlreadyIssued = certificate is not null,
                    WasUnityCorrectlyAnswered = await questionService.WasUnityCorrectlyAnswered(unity.PublicId, publicUserId)
                }
            };
        }
    }
}