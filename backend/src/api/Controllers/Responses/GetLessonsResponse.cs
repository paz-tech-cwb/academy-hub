using System.ComponentModel;

namespace api.Controllers.Responses
{
    public class GetLessonsResponse
    {
        public Guid PublicId { get; set; }
        public string Title { get; set; } = string.Empty;

        [Description("Descrição da aula")]
        public string? Description { get; set; }

        [Description("URL do vídeo da aula")]
        public string? VideoUrl { get; set; }

        public int Sequence { get; set; }
        public bool Concluded { get; set; }
    }
}
