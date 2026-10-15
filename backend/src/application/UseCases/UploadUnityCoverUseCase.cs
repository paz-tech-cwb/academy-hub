using System.Net;
using application.Dtos;
using application.Services;
using domain.Interfaces.Repositories;
using domain.Interfaces.Services;

namespace application.UseCases
{
    public class UploadUnityCoverUseCase(
        IUnityRepository unityRepository,
        IImageProcessor imageProcessor,
        UnityCoverService unityCoverService)
    {
        /// <summary>
        /// Define a capa da unidade a partir de uma imagem já recortada em 16:9 pelo front. Imagens
        /// maiores que 1920x1080 são reduzidas antes de irem para o bucket.
        /// </summary>
        /// <param name="publicId">PublicId da unidade.</param>
        /// <param name="content">Bytes do arquivo enviado.</param>
        /// <returns>200 com a nova URL, 400 com o motivo da recusa ou 404 se a unidade não existir.</returns>
        public async Task<UseCaseResult<object>> ExecuteAsync(Guid publicId, byte[] content)
        {
            var unity = await unityRepository.GetAsync(u => u.PublicId == publicId);
            if (unity is null) return new() { StatusCode = HttpStatusCode.NotFound };

            if (content.Length > UnityCoverService.MaxCoverBytes)
                return BadRequest(UnityCoverService.TooLargeMessage);

            var info = imageProcessor.Inspect(content);
            if (info is null) return BadRequest(UnityCoverService.InvalidFormatMessage);
            if ((long)info.Width * info.Height > UnityCoverService.MaxPixels)
                return BadRequest(UnityCoverService.TooManyPixelsMessage);
            if (!UnityCoverService.Is16By9(info.Width, info.Height))
                return BadRequest(UnityCoverService.WrongRatioMessage);

            if (info.Width > UnityCoverService.MaxWidth || info.Height > UnityCoverService.MaxHeight)
                content = imageProcessor.CropAndResize(content, null, UnityCoverService.MaxWidth, UnityCoverService.MaxHeight, info.Format);

            var coverUrl = await unityCoverService.SaveAsync(unity, content, info.Format);
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
