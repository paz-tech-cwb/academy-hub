using System.ComponentModel;

namespace domain.Dtos
{
    [Description("Função atribuída ao usuário, com as funcionalidades que concede")]
    public class RoleResponse
    {
        [Description("Identificador público da função")]
        public Guid PublicId { get; set; }

        [Description("Nome da função")]
        public string Name { get; set; } = string.Empty;

        [Description("Descrição da função")]
        public string? Description { get; set; }

        [Description("Indica se a função é do sistema e não pode ser alterada ou excluída")]
        public bool IsSystem { get; set; }

        [Description("Funcionalidades concedidas pela função")]
        public List<CapabilityResponse> Capabilities { get; set; } = [];
    }
}
