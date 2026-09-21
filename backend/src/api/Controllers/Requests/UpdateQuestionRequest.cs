using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace api.Controllers.Requests
{
    public class UpdateQuestionRequest
    {
        [Description("Enunciado da questão")]
        [Required]
        public required string Statement { get; set; }
    }
}