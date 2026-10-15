using domain.Dtos;
using domain.Enums;

namespace domain.Interfaces.Services
{
    public interface IImageProcessor
    {
        /// <summary>
        /// Identifica o formato e as dimensões de uma imagem.
        /// </summary>
        /// <param name="content">Bytes do arquivo.</param>
        /// <returns>As informações da imagem, ou <c>null</c> se não for um PNG, JPEG ou WebP válido.</returns>
        ImageInfo? Inspect(byte[] content);

        /// <summary>
        /// Recorta a imagem (opcionalmente), reduz para caber em <paramref name="maxWidth"/> x
        /// <paramref name="maxHeight"/> mantendo a proporção e codifica no formato pedido.
        /// A orientação EXIF é aplicada antes do recorte.
        /// </summary>
        /// <param name="content">Bytes da imagem original.</param>
        /// <param name="crop">Área a recortar, em pixels da imagem já orientada; <c>null</c> usa a imagem inteira.</param>
        /// <param name="maxWidth">Largura máxima do resultado.</param>
        /// <param name="maxHeight">Altura máxima do resultado.</param>
        /// <param name="outputFormat">Formato do arquivo gerado.</param>
        /// <returns>Bytes da imagem processada.</returns>
        byte[] CropAndResize(byte[] content, ImageCrop? crop, int maxWidth, int maxHeight, ImageFormat outputFormat);
    }
}
