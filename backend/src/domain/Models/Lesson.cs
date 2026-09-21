using System.ComponentModel.DataAnnotations.Schema;

namespace domain.Models
{
    [Table("lessons")]
    public class Lesson : BaseEntity
    {
        public string Title { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public int Sequence { get; set; }

        [Column("video_url")]
        public string? VideoUrl { get; set; }

        [Column("unity_id")]
        public int UnityId { get; set; }

        public ICollection<Question> Questions { get; set; } = [];
        public required Unity Unity { get; set; }
    }
}