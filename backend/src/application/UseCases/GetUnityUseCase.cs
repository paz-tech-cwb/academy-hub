using System.Net;
using application.Dtos;
using domain.Interfaces.Repositories;
using domain.Interfaces.Services;

namespace application.UseCases
{
    public class GetUnityUseCase(IUnityRepository unityRepository, ICertificateRepository certificateRepository, IQuestionService questionService)
    {
        /// <summary>
        /// Busca uma unidade pelo nome, junto com o progresso do usuário nela.
        /// </summary>
        /// <param name="unityName">Nome da unidade.</param>
        /// <param name="publicUserId">Id público do usuário autenticado.</param>
        /// <param name="includeInactive">Quando <c>true</c>, também encontra unidades inativas.</param>
        /// <returns>A unidade, ou 404 quando ela não existe ou está inativa sem <paramref name="includeInactive"/>.</returns>
        public async Task<UseCaseResult<UnityResponseDto>> ExecuteAsync(string unityName, Guid publicUserId, bool includeInactive)
        {
            var unity = await unityRepository.GetAsync(u => u.Name == unityName && (includeInactive || u.IsActive));
            if (unity is null) return new() { StatusCode = HttpStatusCode.NotFound };

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
