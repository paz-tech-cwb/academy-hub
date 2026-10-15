using System.ComponentModel;

namespace domain.Enums
{
    /// <summary>
    /// Formatos de imagem aceitos como capa de unidade, detectados pelo
    /// conteúdo do arquivo (não pela extensão).
    /// </summary>
    public enum ImageFormat
    {
        [Description("PNG")]
        Png,

        [Description("JPEG")]
        Jpeg,

        [Description("WebP")]
        Webp
    }
}
