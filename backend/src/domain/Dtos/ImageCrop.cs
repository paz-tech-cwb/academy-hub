namespace domain.Dtos
{
    /// <summary>
    /// Área de recorte em pixels da imagem original: canto superior esquerdo
    /// (<paramref name="X"/>, <paramref name="Y"/>), largura e altura.
    /// </summary>
    public record ImageCrop(int X, int Y, int Width, int Height)
    {
        private const int TolerancePixels = 2;

        /// <summary>
        /// Ajusta a área de recorte aos limites da imagem, absorvendo diferenças de até 2 pixels
        /// causadas por arredondamento no front.
        /// </summary>
        /// <param name="info">Dimensões da imagem.</param>
        /// <returns>A área ajustada, ou <c>null</c> se ela estiver fora da imagem além da tolerância.</returns>
        public ImageCrop? ClampTo(ImageInfo info)
        {
            if (Width <= 0 || Height <= 0) return null;
            if (X < -TolerancePixels || Y < -TolerancePixels) return null;
            if (X + Width > info.Width + TolerancePixels) return null;
            if (Y + Height > info.Height + TolerancePixels) return null;

            var x = Math.Max(0, X);
            var y = Math.Max(0, Y);
            var width = Math.Min(X + Width, info.Width) - x;
            var height = Math.Min(Y + Height, info.Height) - y;

            return width > 0 && height > 0 ? new ImageCrop(x, y, width, height) : null;
        }
    }
}
