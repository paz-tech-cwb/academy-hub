using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace api.Controllers.Requests
{
    public class ChangePasswordRequest
    {
        [Description("Senha atual do usuário, para confirmar a identidade")]
        [Required]
        public required string CurrentPassword { get; set; }

        [Description("Nova senha do usuário")]
        [Required]
        public required string NewPassword { get; set; }
    }
}
