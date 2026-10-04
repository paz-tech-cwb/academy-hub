using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace api.Controllers.Requests
{
    public class ReorderLessonItemRequest
    {
        [Description("PublicId da aula")]
        [Required]
        public required Guid PublicId { get; set; }

        [Description("Nova posição da aula dentro da unidade (base 1)")]
        [Range(1, int.MaxValue)]
        public int Sequence { get; set; }
    }
}