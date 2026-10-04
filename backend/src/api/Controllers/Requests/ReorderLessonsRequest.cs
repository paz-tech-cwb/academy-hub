using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace api.Controllers.Requests
{
    public class ReorderLessonsRequest
    {
        [Description("Aulas da unidade com a nova ordem")]
        [Required]
        [MinLength(1)]
        public required List<ReorderLessonItemRequest> Lessons { get; set; }
    }
}