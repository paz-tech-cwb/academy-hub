namespace domain.Interfaces.Services
{
    /// <summary>
    /// Resolve as capacidades de um usuário percorrendo
    /// usuário → role → perfis → capacidades.
    /// </summary>
    public interface ICapabilityResolver
    {
        /// <summary>
        /// Capacidades do usuário. Usuário inexistente ou inativo resolve para
        /// conjunto vazio, mesmo com JWT válido.
        /// </summary>
        Task<IReadOnlySet<string>> ResolveAsync(Guid userPublicId);

        /// <summary>
        /// Descarta tudo que está em cache. Chamado por toda mutação de
        /// permissionamento e de usuário, para que a mudança valha na hora.
        /// </summary>
        void Invalidate();
    }
}
