using System.ComponentModel;

namespace api.Controllers.Responses
{
    public class AdminLessonResponse
    {
        public Guid PublicId { get; set; }

        [Description("Título da aula")]
        public string Title { get; set; } = string.Empty;

        [Description("Descrição da aula")]
        public string? Description { get; set; }

        [Description("Ordem da aula dentro da unidade")]
        public int Sequence { get; set; }

        [Description("URL do vídeo da aula")]
        public string? VideoUrl { get; set; }

        [Description("Questões da aula com as alternativas (inclui a correta)")]
        public List<AdminQuestionResponse> Questions { get; set; } = [];
    }

    public class AdminQuestionResponse
    {
        public Guid PublicId { get; set; }

        [Description("Enunciado da questão")]
        public string Statement { get; set; } = string.Empty;

        [Description("Alternativas da questão")]
        public List<AdminAlternativeResponse> Alternatives { get; set; } = [];
    }

    public class AdminAlternativeResponse
    {
        public Guid PublicId { get; set; }

        [Description("Texto da alternativa")]
        public string Text { get; set; } = string.Empty;

        [Description("Indica se é a alternativa correta")]
        public bool IsCorrect { get; set; }
    }
}