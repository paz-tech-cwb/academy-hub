using domain.Dtos;
using domain.Enums;
using domain.Interfaces.Services;
using SkiaSharp;

namespace infra.Services
{
    public class SkiaImageProcessor : IImageProcessor
    {
        private const int EncodeQuality = 85;

        /// <summary>
        /// Lê apenas o cabeçalho da imagem para descobrir formato e dimensões, sem decodificar os pixels.
        /// </summary>
        /// <param name="content">Bytes do arquivo.</param>
        /// <returns>As informações da imagem, ou <c>null</c> se não for um PNG, JPEG ou WebP válido.</returns>
        public ImageInfo? Inspect(byte[] content)
        {
            using var data = SKData.CreateCopy(content);
            using var codec = SKCodec.Create(data);
            if (codec is null) return null;

            ImageFormat? format = codec.EncodedFormat switch
            {
                SKEncodedImageFormat.Png => ImageFormat.Png,
                SKEncodedImageFormat.Jpeg => ImageFormat.Jpeg,
                SKEncodedImageFormat.Webp => ImageFormat.Webp,
                _ => null
            };
            if (format is null) return null;

            var (width, height) = SwapsAxes(codec.EncodedOrigin)
                ? (codec.Info.Height, codec.Info.Width)
                : (codec.Info.Width, codec.Info.Height);

            return new ImageInfo(format.Value, width, height);
        }

        /// <summary>
        /// Decodifica a imagem, aplica a orientação EXIF, recorta, reduz para caber no limite
        /// mantendo a proporção e codifica no formato pedido.
        /// </summary>
        /// <param name="content">Bytes da imagem original.</param>
        /// <param name="crop">Área a recortar, em pixels da imagem já orientada; <c>null</c> usa a imagem inteira.</param>
        /// <param name="maxWidth">Largura máxima do resultado.</param>
        /// <param name="maxHeight">Altura máxima do resultado.</param>
        /// <param name="outputFormat">Formato do arquivo gerado.</param>
        /// <returns>Bytes da imagem processada.</returns>
        public byte[] CropAndResize(byte[] content, ImageCrop? crop, int maxWidth, int maxHeight, ImageFormat outputFormat)
        {
            using var data = SKData.CreateCopy(content);
            using var codec = SKCodec.Create(data)
                ?? throw new ArgumentException("O conteúdo não é uma imagem válida.", nameof(content));
            using var decoded = SKBitmap.Decode(codec)
                ?? throw new ArgumentException("Não foi possível decodificar a imagem.", nameof(content));
            using var oriented = ApplyOrigin(decoded, codec.EncodedOrigin);

            var source = crop is null
                ? SKRectI.Create(0, 0, oriented.Width, oriented.Height)
                : SKRectI.Create(crop.X, crop.Y, crop.Width, crop.Height);

            var scale = Math.Min(1d, Math.Min((double)maxWidth / source.Width, (double)maxHeight / source.Height));
            var targetWidth = Math.Max(1, (int)Math.Round(source.Width * scale));
            var targetHeight = Math.Max(1, (int)Math.Round(source.Height * scale));

            using var target = new SKBitmap(targetWidth, targetHeight);
            using (var canvas = new SKCanvas(target))
            using (var sourceImage = SKImage.FromBitmap(oriented))
            {
                canvas.Clear(SKColors.Transparent);
                canvas.DrawImage(
                    sourceImage,
                    SKRect.Create(source.Left, source.Top, source.Width, source.Height),
                    SKRect.Create(0, 0, targetWidth, targetHeight),
                    new SKSamplingOptions(SKCubicResampler.Mitchell));
            }

            using var result = SKImage.FromBitmap(target);
            using var encoded = result.Encode(ToSkiaFormat(outputFormat), EncodeQuality);
            return encoded.ToArray();
        }

        /// <summary>
        /// Indica se a orientação EXIF gira a imagem em 90°/270°, trocando largura e altura.
        /// </summary>
        private static bool SwapsAxes(SKEncodedOrigin origin) => origin is
            SKEncodedOrigin.LeftTop or SKEncodedOrigin.RightTop or
            SKEncodedOrigin.RightBottom or SKEncodedOrigin.LeftBottom;

        /// <summary>
        /// Gera uma cópia da imagem na orientação em que o navegador a exibe. Quando a imagem já
        /// está na orientação padrão, devolve uma cópia sem transformação.
        /// </summary>
        /// <param name="bitmap">Imagem decodificada, na orientação em que foi gravada.</param>
        /// <param name="origin">Orientação EXIF da imagem.</param>
        /// <returns>Nova imagem já orientada; o chamador é responsável por descartá-la.</returns>
        private static SKBitmap ApplyOrigin(SKBitmap bitmap, SKEncodedOrigin origin)
        {
            if (origin == SKEncodedOrigin.TopLeft) return bitmap.Copy();

            float w = bitmap.Width, h = bitmap.Height;
            var matrix = origin switch
            {
                SKEncodedOrigin.TopRight => new SKMatrix(-1, 0, w, 0, 1, 0, 0, 0, 1),
                SKEncodedOrigin.BottomRight => new SKMatrix(-1, 0, w, 0, -1, h, 0, 0, 1),
                SKEncodedOrigin.BottomLeft => new SKMatrix(1, 0, 0, 0, -1, h, 0, 0, 1),
                SKEncodedOrigin.LeftTop => new SKMatrix(0, 1, 0, 1, 0, 0, 0, 0, 1),
                SKEncodedOrigin.RightTop => new SKMatrix(0, -1, h, 1, 0, 0, 0, 0, 1),
                SKEncodedOrigin.RightBottom => new SKMatrix(0, -1, h, -1, 0, w, 0, 0, 1),
                SKEncodedOrigin.LeftBottom => new SKMatrix(0, 1, 0, -1, 0, w, 0, 0, 1),
                _ => SKMatrix.Identity
            };

            var (width, height) = SwapsAxes(origin) ? (bitmap.Height, bitmap.Width) : (bitmap.Width, bitmap.Height);
            var oriented = new SKBitmap(width, height);
            using var canvas = new SKCanvas(oriented);
            canvas.SetMatrix(matrix);
            canvas.DrawBitmap(bitmap, 0, 0, SKSamplingOptions.Default);
            return oriented;
        }

        /// <summary>
        /// Converte o formato do domínio para o formato de codificação do SkiaSharp.
        /// </summary>
        private static SKEncodedImageFormat ToSkiaFormat(ImageFormat format) => format switch
        {
            ImageFormat.Png => SKEncodedImageFormat.Png,
            ImageFormat.Jpeg => SKEncodedImageFormat.Jpeg,
            ImageFormat.Webp => SKEncodedImageFormat.Webp,
            _ => throw new ArgumentOutOfRangeException(nameof(format))
        };
    }
}
