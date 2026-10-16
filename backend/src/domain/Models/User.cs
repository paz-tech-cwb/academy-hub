using System.ComponentModel.DataAnnotations.Schema;
using domain.Enums;

namespace domain.Models
{
    [Table("users")]
    public class User : BaseEntity
    {
        public required string Username { get; set; }

        public required string Password { get; set; }

        public long Experience { get; set; }

        public bool Status { get; set; }

        public Roles Role { get; set; }

        [Column("profile_pic_url")]
        public string? ProfilePicUrl { get; set; }

        public string? Instagram { get; set; }

        public string? Email { get; set; }
    }
}
