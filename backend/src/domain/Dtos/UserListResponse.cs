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
    }
}
