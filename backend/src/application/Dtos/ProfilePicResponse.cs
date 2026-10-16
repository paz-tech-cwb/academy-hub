using System.ComponentModel;

namespace application.Dtos
{
    [Description("Foto de perfil após a alteração")]
    public class ProfilePicResponse
    {
        [Description("URL pública da nova foto, já com o parâmetro de versão (?v=) que evita cache da imagem anterior")]
        public string ProfilePicUrl { get; set; } = string.Empty;
    }
}
