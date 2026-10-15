using domain.Enums;

namespace domain.Dtos
{
    /// <summary>
    /// Formato e dimensões de uma imagem, já considerando a orientação EXIF
    /// (a mesma largura e altura que o navegador exibe).
    /// </summary>
    public record ImageInfo(ImageFormat Format, int Width, int Height);
}
