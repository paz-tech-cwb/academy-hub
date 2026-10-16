using System.ComponentModel;

namespace domain.Dtos
{
    public class LeaderboardResponse
    {
        [Description("Posição no ranking global. 1 = maior XP.")]
        public int Position { get; set; }

        public Guid PublicId { get; set; }

        [Description("Nome de usuário.")]
        public string Username { get; set; } = string.Empty;

        [Description("Quantidade de XP acumulada.")]
        public long Experience { get; set; }

        [Description("URL pública da foto de perfil do usuário. Nula quando o usuário não tem foto.")]
        public string? ProfilePicUrl { get; set; }
    }
}