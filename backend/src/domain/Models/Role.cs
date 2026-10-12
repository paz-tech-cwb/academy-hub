using System.ComponentModel.DataAnnotations.Schema;

namespace domain.Models
{
    [Table("roles")]
    public class Role : BaseEntity
    {
        public required string Name { get; set; }

        public string? Description { get; set; }

        [Column("is_system")]
        public bool IsSystem { get; set; }

        public ICollection<RoleCapability> RoleCapabilities { get; set; } = [];
    }
}
