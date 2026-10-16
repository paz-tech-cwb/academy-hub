using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace api.Controllers.Requests
{
    public class SetProfilePicFromUrlRequest
    {
        [Description("URL pública (http ou https) de uma imagem PNG, JPG ou WebP de até 10 MB")]
        [Required]
        public required string Url { get; set; }

        [Description("Posição horizontal, em pixels da imagem original, do canto superior esquerdo do recorte")]
        public int CropX { get; set; }

        [Description("Posição vertical, em pixels da imagem original, do canto superior esquerdo do recorte")]
        public int CropY { get; set; }

        [Description("Largura do recorte em pixels da imagem original. Deve ser igual à altura (recorte quadrado)")]
        public int CropWidth { get; set; }

        [Description("Altura do recorte em pixels da imagem original")]
        public int CropHeight { get; set; }
    }
}
