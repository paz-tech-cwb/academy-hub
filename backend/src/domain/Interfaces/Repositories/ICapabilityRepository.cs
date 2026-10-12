using domain.Models;

namespace domain.Interfaces.Repositories
{
    /// <summary>
    /// O catálogo é definido em código (<c>domain.Constants.Capabilities</c>),
    /// então a base já cobre tudo que a API precisa: ler e editar rótulo.
    /// </summary>
    public interface ICapabilityRepository : IBaseRepository<Capability>
    {
    }
}
