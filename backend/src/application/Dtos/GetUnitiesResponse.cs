using System.ComponentModel;

namespace application.Dtos
{
    public class GetUnitiesResponse
    {
        public Guid PublicId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; } = string.Empty;
        public string? UnityCover { get; set; } = string.Empty;

        [Description("Indica se a unidade está ativa, ou seja, visível para todos os usuários.")]
        public bool IsActive { get; set; }
    }
}
