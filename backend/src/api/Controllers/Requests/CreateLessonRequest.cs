using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace api.Controllers.Requests
{
    public class CreateLessonRequest
    {
        [Description("PublicId da unidade a que a aula pertence")]
        [Required]
        public required Guid UnityPublicId { get; set; }

        [Description("Título da aula")]
        [Required]
        public required string Title { get; set; }

        [Description("Descrição da aula")]
        public string? Description { get; set; }

        [Description("Ordem da aula dentro da unidade")]
        public int Sequence { get; set; }

        [Description("URL do vídeo da aula")]
        public string? VideoUrl { get; set; }
    }
}