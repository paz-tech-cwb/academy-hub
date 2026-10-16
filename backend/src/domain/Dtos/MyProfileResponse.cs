using System.ComponentModel;

namespace domain.Dtos
{
    [Description("Dados editáveis do perfil do usuário autenticado, incluindo os que não aparecem no perfil público")]
    public class MyProfileResponse
    {
        [Description("URL pública da foto de perfil. Nula quando o usuário não tem foto.")]
        public string? ProfilePicUrl { get; set; }

        [Description("Texto de apresentação exibido no perfil público.")]
        public string? AboutMe { get; set; }

        [Description("Identificador ou endereço do perfil no Instagram.")]
        public string? Instagram { get; set; }

        [Description("E-mail do usuário. Não aparece no perfil público.")]
        public string? Email { get; set; }
    }
}
