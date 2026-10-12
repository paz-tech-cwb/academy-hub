namespace domain.Constants
{
    /// <summary>
    /// Catálogo de capacidades. São <c>const</c> porque aparecem em
    /// <c>[Authorize(Policy = ...)]</c>, e cada código tem uma linha
    /// correspondente na tabela <c>capabilities</c>.
    /// </summary>
    public static class Capabilities
    {
        public const string ContentManage = "content.manage";
        public const string ContentRead = "content.read";
        public const string QuestionnaireManage = "questionnaire.manage";
        public const string PlaylistImport = "playlist.import";
        public const string UsersManage = "users.manage";
        public const string PermissionsManage = "permissions.manage";

        /// <summary>
        /// Alimenta o registro das policies e a resposta de
        /// <c>GET /api/me/capabilities</c> para o Admin.
        /// </summary>
        public static readonly string[] All =
        [
            ContentManage,
            ContentRead,
            QuestionnaireManage,
            PlaylistImport,
            UsersManage,
            PermissionsManage
        ];
    }
}
