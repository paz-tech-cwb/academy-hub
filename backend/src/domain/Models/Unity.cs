using System.ComponentModel.DataAnnotations.Schema;

namespace domain.Models
{
    [Table("unities")]
    public class Unity : BaseEntity
    {
        public required string Name { get; set; }
        public string? Description { get; set; }

        public ICollection<Lesson> Lessons { get; set; } = [];
    }
}