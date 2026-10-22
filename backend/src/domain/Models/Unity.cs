using System.ComponentModel.DataAnnotations.Schema;

namespace domain.Models
{
    [Table("unities")]
    public class Unity : BaseEntity
    {
        public required string Name { get; set; }
        public string? Description { get; set; }

        [Column("cover_url")]
        public string? CoverUrl { get; set; }

        [Column("is_active")]
        public bool IsActive { get; set; }

        public ICollection<Lesson> Lessons { get; set; } = [];
    }
}