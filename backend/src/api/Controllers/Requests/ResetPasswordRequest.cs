using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace api.Controllers.Requests
{
    public class ResetPasswordRequest
    {
        [Description("Nova senha do usuário")]
        [Required]
        public required string NewPassword { get; set; }
    }
}
