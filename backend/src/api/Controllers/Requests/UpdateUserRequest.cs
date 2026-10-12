using System.ComponentModel;

namespace api.Controllers.Requests
{
    public class UpdateUserRequest
    {
        [Description("Status do usuário (ativo/inativo)")]
        public bool? Status { get; set; }

        [Description("Identificador público da função a atribuir ao usuário")]
        public Guid? RolePublicId { get; set; }
    }
}
