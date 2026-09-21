namespace domain.Dtos
{
    public class AnswerVerifyOut
    {
        public Guid PublicQuestionId { get; set; }
        public Guid PublicAlternativeId { get; set; }
        public bool IsCorrect { get; set; }
    }
}