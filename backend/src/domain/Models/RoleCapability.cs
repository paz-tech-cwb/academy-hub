using System.ComponentModel.DataAnnotations.Schema;

namespace domain.Models
{
    /// <summary>
    /// Junção N:N explícita entre <see cref="Role"/> e <see cref="Capability"/>.
    /// Entidade própria (e não N:N por convenção) para que as colunas fiquem em
    /// snake_case e a junção tenha <c>public_id</c>, endereçável como o resto da API.
    /// </summary>
    [Table("role_capabilities")]
    public class RoleCapability : BaseEntity
    {
        [Column("role_id")]
        public int RoleId { get; set; }

        [Column("capability_id")]
        public int CapabilityId { get; set; }

        public Role Role { get; set; } = null!;

        public Capability Capability { get; set; } = null!;
    }
}
