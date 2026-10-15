namespace domain.Dtos
{
    /// <summary>
    /// Área de recorte em pixels da imagem original: canto superior esquerdo
    /// (<paramref name="X"/>, <paramref name="Y"/>), largura e altura.
    /// </summary>
    public record ImageCrop(int X, int Y, int Width, int Height);
}
