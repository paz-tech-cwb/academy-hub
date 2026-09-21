using System.ComponentModel.DataAnnotations.Schema;

namespace domain.Models
{
    [Table("certificates")]
    public class Certificate : BaseEntity
    {
        [Column("unity_id")]
        public int UnityId { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        public Unity? Unity { get; set; }

        public User? User { get; set; }
    }
}