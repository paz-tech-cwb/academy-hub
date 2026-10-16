using System.Net;
using application.Dtos;
using application.Services;
using domain.Dtos;
using domain.Enums;
using domain.Interfaces.Repositories;
using domain.Interfaces.Services;

namespace application.UseCases
{
    public class SetUnityCoverFromUrlUseCase(
        IUnityRepository unityRepository,
        IRemoteImageDownloader remoteImageDownloader,
        IImageProcessor imageProcessor,
        UnityCoverService unityCoverService)
    {
        private const long MaxDownloadBytes = 10 * 1024 * 1024;

        private const string DownloadFailedMessage =
            "Não foi possível baixar a imagem dessa URL. Verifique se o link é público e aponta diretamente para uma imagem PNG, JPG ou WebP de até 10 MB.";
        private const string CropOutOfBoundsMessage = "A área de recorte está fora dos limites da imagem.";

        /// <summary>
        /// Baixa uma imagem da internet, recorta na área escolhida no front, reduz para no máximo
        /// 1920x1080 e grava como capa da unidade.
        /// </summary>
        /// <param name="publicId">PublicId da unidade.</param>
        /// <param name="url">URL pública da imagem.</param>
        /// <param name="crop">Área de recorte em pixels da imagem original.</param>
        /// <returns>200 com a nova URL, 400 com o motivo da recusa ou 404 se a unidade não existir.</returns>
        public async Task<UseCaseResult<object>> ExecuteAsync(Guid publicId, Uri url, ImageCrop crop)
        {
            var unity = await unityRepository.GetAsync(u => u.PublicId == publicId);
            if (unity is null) return new() { StatusCode = HttpStatusCode.NotFound };

            var content = await remoteImageDownloader.DownloadAsync(url, MaxDownloadBytes);
            if (content is null) return BadRequest(DownloadFailedMessage);

            var info = imageProcessor.Inspect(content);
            if (info is null) return BadRequest(UnityCoverService.InvalidFormatMessage);
            if ((long)info.Width * info.Height > UnityCoverService.MaxPixels)
                return BadRequest(UnityCoverService.TooManyPixelsMessage);

            var clamped = crop.ClampTo(info);
            if (clamped is null) return BadRequest(CropOutOfBoundsMessage);
            if (!UnityCoverService.Is16By9(clamped.Width, clamped.Height))
                return BadRequest(UnityCoverService.WrongRatioMessage);

            var format = info.Format;
            var processed = imageProcessor.CropAndResize(content, clamped, UnityCoverService.MaxWidth, UnityCoverService.MaxHeight, format);

            // PNG de foto costuma passar de 2 MB mesmo em 1920x1080; WebP mantém a transparência e fica bem menor.
            if (processed.Length > UnityCoverService.MaxCoverBytes && format == ImageFormat.Png)
            {
                format = ImageFormat.Webp;
                processed = imageProcessor.CropAndResize(content, clamped, UnityCoverService.MaxWidth, UnityCoverService.MaxHeight, format);
            }
            if (processed.Length > UnityCoverService.MaxCoverBytes)
                return BadRequest(UnityCoverService.TooLargeMessage);

            var coverUrl = await unityCoverService.SaveAsync(unity, processed, format);
            return new() { Content = new UnityCoverResponse { CoverUrl = coverUrl } };
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
