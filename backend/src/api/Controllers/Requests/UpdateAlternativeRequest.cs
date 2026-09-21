using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace api.Controllers.Requests
{
    public class UpdateAlternativeRequest
    {
        [Description("Texto da alternativa")]
        [Required]
        public required string Text { get; set; }

        [Description("Indica se é a alternativa correta")]
        public bool IsCorrect { get; set; }
    }
}