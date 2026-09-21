using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace api.Controllers.Requests
{
    public class LoginRequest
    {

        [Description("Nome de usuário")]
        [Required]
        public required string Username { get; set; }

        [Description("Senha previamente criada através do endpoint `api/user/register`.")]
        [Required]
        public required string Password { get; set; }
    }
}