using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace api.Controllers.Requests
{
    public class SetUnityCoverFromUrlRequest
    {
        [Description("URL pública (http ou https) de uma imagem PNG, JPG ou WebP de até 10 MB")]
        [Required]
        public required string Url { get; set; }

        [Description("Posição horizontal, em pixels da imagem original, do canto superior esquerdo do recorte")]
        public int CropX { get; set; }

        [Description("Posição vertical, em pixels da imagem original, do canto superior esquerdo do recorte")]
        public int CropY { get; set; }

        [Description("Largura do recorte em pixels da imagem original. Junto com a altura, deve formar a proporção 16:9")]
        public int CropWidth { get; set; }

        [Description("Altura do recorte em pixels da imagem original")]
        public int CropHeight { get; set; }
    }
}
