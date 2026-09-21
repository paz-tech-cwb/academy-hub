using System.ComponentModel;

namespace domain.Dtos
{
    public class QuestionDtoResponse
    {
        public Guid PublicId { get; set; }

        [Description("Título da questão")]
        public string Statement { get; set; } = string.Empty;

        [Description("Alternativas da questão")]
        public IEnumerable<AlternativeDtoOut> Alternatives { get; set; } = [];
    }
}