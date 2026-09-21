using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace api.Controllers.Requests
{
    public class RegisterRequest
    {
        [Description("Nome de usuário, nickname")]
        [Required]
        public required string Username { get; set; }
        
        [Description("Senha que será utilizada no login")]
        [Required]
        public required string Password { get; set; }
    }
}