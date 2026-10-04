using System.ComponentModel;
using domain.Enums;

namespace api.Controllers.Requests
{
    public class UpdateUserRequest
    {
        [Description("Status do usuário (ativo/inativo)")]
        public bool? Status { get; set; }

        [Description("Role do usuário")]
        public Roles? Role { get; set; }
    }
}
