using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace api.Controllers.Requests
{
    public class CreateUnityRequest
    {
        [Description("Nome da unidade")]
        [Required]
        public required string Name { get; set; }

        [Description("Descrição da unidade")]
        public string? Description { get; set; }
    }
}