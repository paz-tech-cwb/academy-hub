using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace domain.Models
{
    public class BaseEntity
    {
        [Key]
        public int Id { get; set; }

        [Column("public_id")]
        public Guid PublicId { get; set; } = Guid.NewGuid();
    }
}