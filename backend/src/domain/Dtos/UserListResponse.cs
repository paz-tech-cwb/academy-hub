using domain.Enums;

namespace domain.Dtos
{
    public class UserListResponse
    {
        public Guid PublicId { get; set; }
        public string Username { get; set; } = string.Empty;
        public long Experience { get; set; }
        public bool Status { get; set; }
        public Roles Role { get; set; }

        /// <summary>
        /// Como a tela de usuários passou a montar o seletor de funções a
        /// partir de <c>GET /api/role</c>, ela precisa do publicId para
        /// pré-selecionar a função atual e do nome para exibi-la — inclusive
        /// para funções criadas em runtime, que não existem no enum.
        /// </summary>
        public Guid? RolePublicId { get; set; }

        public string RoleName { get; set; } = string.Empty;
    }
}
