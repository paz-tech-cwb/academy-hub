using System.ComponentModel.DataAnnotations.Schema;

namespace domain.Models
{
    [Table("alternatives")]
    public class Alternative : BaseEntity
    {
        public string Text { get; set; } = string.Empty;

        [Column("is_correct")]
        public bool IsCorrect { get; set; }

        [Column("question_id")]
        public int QuestionId { get; set; }

        public Question Question { get; set; } = null!;
    }
}