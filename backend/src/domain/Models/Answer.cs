using System.ComponentModel.DataAnnotations.Schema;

namespace domain.Models
{
    [Table("answers")]
    public class Answer : BaseEntity
    {
        [Column("alternative_id")]
        public int AlternativeId { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        [Column("question_id")]
        public int QuestionId { get; set; }

        [Column("lesson_id")]
        public int LessonId { get; set; }

        [Column("unity_id")]
        public int UnityId { get; set; }

        [Column("is_correct")]
        public bool IsCorrect { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        public Question Question { get; set; } = null!;
        public Unity Unity { get; set; } = null!;
        public User User { get; set; } = null!;
        public Alternative Alternative { get; set; } = null!;
        public Lesson Lesson { get; set; } = null!;
    }
}