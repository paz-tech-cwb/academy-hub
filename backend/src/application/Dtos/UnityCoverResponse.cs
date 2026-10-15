using System.ComponentModel;

namespace application.Dtos
{
    [Description("Capa da unidade após a alteração")]
    public class UnityCoverResponse
    {
        [Description("URL pública da nova capa, já com o parâmetro de versão (?v=) que evita cache da imagem anterior")]
        public string CoverUrl { get; set; } = string.Empty;
    }
}
