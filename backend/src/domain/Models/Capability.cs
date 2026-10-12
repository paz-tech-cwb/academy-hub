using System.ComponentModel.DataAnnotations.Schema;

namespace domain.Models
{
    [Table("capabilities")]
    public class Capability : BaseEntity
    {
        public required string Code { get; set; }

        public required string Name { get; set; }

        public string? Description { get; set; }
    }
}
