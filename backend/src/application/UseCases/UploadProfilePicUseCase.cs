using System.Net;
using application.Dtos;
using application.Services;
using domain.Interfaces.Repositories;
using domain.Interfaces.Services;

namespace application.UseCases
{
    public class UploadProfilePicUseCase(
        IUserRepository userRepository,
        IImageProcessor imageProcessor,
        ProfilePicService profilePicService)
    {
        /// <summary>
        /// Define a foto de perfil do usuário a partir de uma imagem já recortada em quadrado pelo
        /// front. Imagens maiores que 512x512 são reduzidas antes de irem para o bucket.
        /// </summary>
        /// <param name="userPublicId">PublicId do usuário.</param>
        /// <param name="content">Bytes do arquivo enviado.</param>
        /// <returns>200 com a nova URL, 400 com o motivo da recusa ou 404 se o usuário não existir.</returns>
        public async Task<UseCaseResult<object>> ExecuteAsync(Guid userPublicId, byte[] content)
        {
            var user = await userRepository.GetAsync(u => u.PublicId == userPublicId);
            if (user is null) return new() { StatusCode = HttpStatusCode.NotFound };

            if (content.Length > ProfilePicService.MaxPicBytes)
                return BadRequest(ProfilePicService.TooLargeMessage);

            var info = imageProcessor.Inspect(content);
            if (info is null) return BadRequest(ProfilePicService.InvalidFormatMessage);
            if ((long)info.Width * info.Height > ProfilePicService.MaxPixels)
                return BadRequest(ProfilePicService.TooManyPixelsMessage);
            if (!ProfilePicService.IsSquare(info.Width, info.Height))
                return BadRequest(ProfilePicService.WrongRatioMessage);

            if (info.Width > ProfilePicService.MaxSize || info.Height > ProfilePicService.MaxSize)
                content = imageProcessor.CropAndResize(content, null, ProfilePicService.MaxSize, ProfilePicService.MaxSize, info.Format);

            var profilePicUrl = await profilePicService.SaveAsync(user, content, info.Format);
            return new() { Content = new ProfilePicResponse { ProfilePicUrl = profilePicUrl } };
        }

        /// <summary>
        /// Monta uma resposta 400 com a mensagem exibida ao usuário.
        /// </summary>
        private static UseCaseResult<object> BadRequest(string message) => new()
        {
            StatusCode = HttpStatusCode.BadRequest,
            Content = new MessageResponse { Message = message }
        };
    }
}
