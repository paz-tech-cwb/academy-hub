using domain.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;

namespace api.Authorization
{
    internal class CapabilityAuthorizationHandler(ICapabilityResolver capabilityResolver) : AuthorizationHandler<CapabilityRequirement>
    {
        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, CapabilityRequirement requirement)
        {
            // Primeira camada da proteção contra lockout: o Admin passa antes
            // de tocar em cache ou banco, então segue entrando mesmo com as
            // tabelas de permissionamento vazias ou o MySQL fora do ar.
            if (context.User.IsPlatformAdmin())
            {
                context.Succeed(requirement);
                return;
            }

            // Sem nameid legível não há como resolver: falha fechado.
            if (!context.User.TryGetUserPublicId(out var userPublicId)) return;

            var capabilities = await capabilityResolver.ResolveAsync(userPublicId);

            if (capabilities.Contains(requirement.Code))
                context.Succeed(requirement);
        }
    }
}
