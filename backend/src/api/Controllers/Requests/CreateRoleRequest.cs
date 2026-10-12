using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace api.Controllers.Requests
{
    public class CreateRoleRequest
    {
        [Description("Nome da função")]
        [Required]
        public required string Name { get; set; }

        [Description("Descrição da função")]
        public string? Description { get; set; }
    }
}
