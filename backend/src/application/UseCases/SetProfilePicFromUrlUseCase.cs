using System.Net;
using application.Dtos;
using application.Services;
using domain.Dtos;
using domain.Enums;
using domain.Interfaces.Repositories;
using domain.Interfaces.Services;

namespace application.UseCases
{
    public class SetProfilePicFromUrlUseCase(
        IUserRepository userRepository,
        IRemoteImageDownloader remoteImageDownloader,
        IImageProcessor imageProcessor,
        ProfilePicService profilePicService)
    {
        private const long MaxDownloadBytes = 10 * 1024 * 1024;

        private const string DownloadFailedMessage =
            "Não foi possível baixar a imagem dessa URL. Verifique se o link é público e aponta diretamente para uma imagem PNG, JPG ou WebP de até 10 MB.";
        private const string CropOutOfBoundsMessage = "A área de recorte está fora dos limites da imagem.";

        /// <summary>
        /// Baixa uma imagem da internet, recorta na área quadrada escolhida no front, reduz para no
        /// máximo 512x512 e grava como foto de perfil do usuário.
        /// </summary>
        /// <param name="userPublicId">PublicId do usuário.</param>
        /// <param name="url">URL pública da imagem.</param>
        /// <param name="crop">Área de recorte em pixels da imagem original.</param>
        /// <returns>200 com a nova URL, 400 com o motivo da recusa ou 404 se o usuário não existir.</returns>
        public async Task<UseCaseResult<object>> ExecuteAsync(Guid userPublicId, Uri url, ImageCrop crop)
        {
            var user = await userRepository.GetAsync(u => u.PublicId == userPublicId);
            if (user is null) return new() { StatusCode = HttpStatusCode.NotFound };

            var content = await remoteImageDownloader.DownloadAsync(url, MaxDownloadBytes);
            if (content is null) return BadRequest(DownloadFailedMessage);

            var info = imageProcessor.Inspect(content);
            if (info is null) return BadRequest(ProfilePicService.InvalidFormatMessage);
            if ((long)info.Width * info.Height > ProfilePicService.MaxPixels)
                return BadRequest(ProfilePicService.TooManyPixelsMessage);

            var clamped = crop.ClampTo(info);
            if (clamped is null) return BadRequest(CropOutOfBoundsMessage);
            if (!ProfilePicService.IsSquare(clamped.Width, clamped.Height))
                return BadRequest(ProfilePicService.WrongRatioMessage);

            var format = info.Format;
            var processed = imageProcessor.CropAndResize(content, clamped, ProfilePicService.MaxSize, ProfilePicService.MaxSize, format);

            // Em 512x512 dificilmente passa de 2 MB, mas um PNG muito detalhado ainda pode; WebP fica bem menor.
            if (processed.Length > ProfilePicService.MaxPicBytes && format == ImageFormat.Png)
            {
                format = ImageFormat.Webp;
                processed = imageProcessor.CropAndResize(content, clamped, ProfilePicService.MaxSize, ProfilePicService.MaxSize, format);
            }
            if (processed.Length > ProfilePicService.MaxPicBytes)
                return BadRequest(ProfilePicService.TooLargeMessage);

            var profilePicUrl = await profilePicService.SaveAsync(user, processed, format);
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
