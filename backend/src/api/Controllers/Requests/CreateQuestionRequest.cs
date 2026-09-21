using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace api.Controllers.Requests
{
    public class CreateQuestionRequest
    {
        [Description("PublicId da aula a que a questão pertence")]
        [Required]
        public required Guid LessonPublicId { get; set; }

        [Description("Enunciado da questão")]
        [Required]
        public required string Statement { get; set; }
    }
}