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

        [Description("Alternativa escolhida pelo usuário na última tentativa. Nulo quando a questão ainda não foi respondida")]
        public Guid? LastSelectedAlternativeId { get; set; }

        [Description("Indica se a última resposta do usuário estava correta. Nulo quando a questão ainda não foi respondida")]
        public bool? LastAnswerIsCorrect { get; set; }
    }
}
