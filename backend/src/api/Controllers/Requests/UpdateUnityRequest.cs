using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace api.Controllers.Requests
{
    public class UpdateUnityRequest
    {
        [Description("Nome da unidade")]
        [Required]
        public required string Name { get; set; }

        [Description("Descrição da unidade")]
        public string? Description { get; set; }

        [Description("Indica se a unidade está ativa. Unidades inativas, e as aulas delas, só ficam visíveis para quem visualiza ou gerencia conteúdos.")]
        public required bool IsActive { get; set; }
    }
}