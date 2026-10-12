using Microsoft.AspNetCore.Authorization;

namespace api.Authorization
{
    /// <summary>
    /// Exige que o usuário tenha a capacidade de código <see cref="Code"/>.
    /// Há uma policy registrada por código de <c>domain.Constants.Capabilities.All</c>.
    /// </summary>
    public class CapabilityRequirement(string code) : IAuthorizationRequirement
    {
        public string Code { get; } = code;
    }
}
