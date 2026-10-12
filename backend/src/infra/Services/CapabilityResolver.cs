using domain.Interfaces.Repositories;
using domain.Interfaces.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Primitives;

namespace infra.Services
{
    /// <summary>
    /// Singleton com cache em memória. É singleton de propósito: num cache hit
    /// nada de banco é construído, enquanto um repositório injetado faria o DI
    /// montar o AppDbContext (e abrir conexão, por causa do
    /// ServerVersion.AutoDetect) a cada request autenticado. O escopo só é
    /// criado no miss.
    /// </summary>
    internal class CapabilityResolver(IMemoryCache cache, IServiceScopeFactory scopeFactory) : ICapabilityResolver
    {
        private static readonly TimeSpan Ttl = TimeSpan.FromMinutes(5);
        private static readonly IReadOnlySet<string> Empty = new HashSet<string>();

        /// <summary>
        /// IMemoryCache não tem "clear": cada entrada carrega um
        /// CancellationChangeToken desta fonte, e Invalidate() a troca e cancela.
        /// Evicção total sem bookkeeping de chaves.
        /// </summary>
        private CancellationTokenSource _resetSource = new();

        public async Task<IReadOnlySet<string>> ResolveAsync(Guid userPublicId)
        {
            var key = $"capabilities:{userPublicId}";

            if (cache.TryGetValue(key, out IReadOnlySet<string>? cached) && cached is not null)
                return cached;

            // O token é capturado antes da carga: se Invalidate() acontecer no
            // meio, a entrada entra no cache já invalidada em vez de mascarar
            // a mudança até o TTL.
            var resetToken = Volatile.Read(ref _resetSource).Token;
            var codes = await LoadAsync(userPublicId);

            var options = new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = Ttl };
            options.AddExpirationToken(new CancellationChangeToken(resetToken));
            cache.Set(key, codes, options);

            return codes;
        }

        public void Invalidate()
        {
            // Sem Dispose: a fonte antiga ainda pode ser lida por um resolve
            // em andamento, e descartá-la faria esse resolve estourar.
            Interlocked.Exchange(ref _resetSource, new CancellationTokenSource()).Cancel();
        }

        private async Task<IReadOnlySet<string>> LoadAsync(Guid userPublicId)
        {
            using var scope = scopeFactory.CreateScope();

            // UserRepository.GetAsync devolve null para usuário inativo, então
            // inativar um usuário tira o acesso mesmo com JWT válido.
            var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
            var user = await userRepository.GetAsync(u => u.PublicId == userPublicId);
            if (user is null) return Empty;

            var roleRepository = scope.ServiceProvider.GetRequiredService<IRoleRepository>();
            var codes = await roleRepository.GetCodesByRoleIdAsync((int)user.Role);

            return codes.ToHashSet();
        }
    }
}
