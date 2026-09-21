using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace api.Controllers.Requests
{
    public class CreateAlternativeRequest
    {
        [Description("PublicId da questão a que a alternativa pertence")]
        [Required]
        public required Guid QuestionPublicId { get; set; }

        [Description("Texto da alternativa")]
        [Required]
        public required string Text { get; set; }

        [Description("Indica se é a alternativa correta")]
        public bool IsCorrect { get; set; }
    }
}