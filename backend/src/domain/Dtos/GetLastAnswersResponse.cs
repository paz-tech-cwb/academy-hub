using System.ComponentModel;

namespace domain.Dtos
{
    public class GetLastAnswersResponse
    {
        public List<AnswerVerifyOut> Answers { get; set; } = [];

        [Description("Quantidade de XP que o usuário vai ganhar caso acerte todas as questões da lição")]
        public int CurrentPointsWeight { get; set; }

        [Description("Indica se todas as questões da lição foram corretamente respondidas")]
        public bool WasLessonCorrectlyAnswered { get; set; }

        [Description("Indica se todas as questões da unidade foram corretamente respondidas")]
        public bool WasUnityCorrectlyAnswered { get; set; }

        [Description("Indica se todas o certificado já foi emitido para esta unidade")]
        public bool WasCertificateAlreadyIssued { get; set; }

        [Description("Mensagem amigável para debug. Normalmente não precisa ser mostrado no front")]
        public string? Message { get; set; }
    }
}