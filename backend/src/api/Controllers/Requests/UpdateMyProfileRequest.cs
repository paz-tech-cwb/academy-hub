using System.ComponentModel;

namespace api.Controllers.Requests
{
    public class UpdateMyProfileRequest
    {
        [Description("Texto de apresentação exibido no perfil público, com até 1000 caracteres. Vazio ou nulo remove o texto")]
        public string? AboutMe { get; set; }

        [Description("Identificador (@usuario) ou endereço do perfil no Instagram, com até 255 caracteres. Vazio ou nulo remove o Instagram")]
        public string? Instagram { get; set; }

        [Description("E-mail do usuário, com até 255 caracteres. Não aparece no perfil público. Vazio ou nulo remove o e-mail")]
        public string? Email { get; set; }
    }
}
