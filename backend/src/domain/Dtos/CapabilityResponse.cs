using System.ComponentModel;

namespace domain.Dtos
{
    [Description("Funcionalidade que pode ser concedida a um perfil")]
    public class CapabilityResponse
    {
        [Description("Identificador público da funcionalidade")]
        public Guid PublicId { get; set; }

        [Description("Código usado no enforcement do backend")]
        public string Code { get; set; } = string.Empty;

        [Description("Rótulo exibido na interface")]
        public string Name { get; set; } = string.Empty;

        [Description("Descrição do que a funcionalidade permite")]
        public string? Description { get; set; }
    }
}
