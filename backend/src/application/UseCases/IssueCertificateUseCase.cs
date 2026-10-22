using System.Net;
using application.Dtos;
using domain.Interfaces.Repositories;
using domain.Interfaces.Services;
using domain.Models;

namespace application.UseCases
{
    public class IssueCertificateUseCase(
        IQuestionService questionService,
        ICertificateRepository certificateRepository,
        IUserRepository userRepository,
        IUnityRepository unityRepository)
    {
        /// <summary>
        /// Emite o certificado da unidade quando o usuário respondeu corretamente todas as questões dela.
        /// </summary>
        /// <param name="publicUserId">Id público do usuário autenticado.</param>
        /// <param name="unityName">Nome da unidade.</param>
        /// <param name="includeInactive">Quando <c>true</c>, também permite emitir o certificado de unidades inativas.</param>
        /// <returns>A mensagem de sucesso, ou 400 com o motivo da recusa.</returns>
        public async Task<UseCaseResult<string>> ExecuteAsync(Guid publicUserId, string unityName, bool includeInactive)
        {
            var result = new UseCaseResult<string>();

            var unity = await unityRepository.GetAsync(u => u.Name == unityName && (includeInactive || u.IsActive));
            var user = await userRepository.GetAsyncNotNull(u => u.PublicId == publicUserId);

            if (unity is null) return new()
            {
                Content = "Unidade inválida.",
                StatusCode = HttpStatusCode.BadRequest
            };

            var existentCertificate = await certificateRepository.GetAsync(c => c.User!.PublicId == publicUserId && c.Unity!.PublicId == unity.PublicId);
            if (existentCertificate is not null)
            {
                return new()
                {
                    StatusCode = HttpStatusCode.BadRequest,
                    Content = "O Certificado já havia sido emitido."
                };
            }

            if (await questionService.WasUnityCorrectlyAnswered(unity.PublicId, publicUserId))
            {
                var certificate = new Certificate
                {
                    CreatedAt = DateTime.Now,
                    UnityId = unity.Id,
                    UserId = user.Id
                };

                await certificateRepository.InsertAsync(certificate);

                result = new()
                {
                    Content = "Certificado emitido com sucesso!",
                };
            }
            else
            {
                result = new()
                {
                    StatusCode = HttpStatusCode.BadRequest,
                    Content = "Nem todas as questões foram respondidas corretamente.",
                };
            }

            return result;
        }
    }
}