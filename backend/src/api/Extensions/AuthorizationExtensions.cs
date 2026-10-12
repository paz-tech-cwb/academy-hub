using api.Authorization;
using domain.Constants;
using Microsoft.AspNetCore.Authorization;

namespace api.Extensions
{
    public static class AuthorizationExtensions
    {
        /// <summary>
        /// Registra uma policy por código de capacidade. Fica separado de
        /// <c>AddJwt</c> porque as opções de <c>AddAuthorization</c> são
        /// aditivas, então o diff daquele arquivo continua zero.
        /// </summary>
        public static void AddCapabilityAuthorization(this IServiceCollection services)
        {
            services.AddAuthorization(options =>
            {
                foreach (var code in Capabilities.All)
                {
                    // RequireAuthenticatedUser mantém os status corretos:
                    // sem token devolve 401, token sem a capacidade devolve 403.
                    options.AddPolicy(code, policy => policy
                        .RequireAuthenticatedUser()
                        .AddRequirements(new CapabilityRequirement(code)));
                }
            });

            services.AddSingleton<IAuthorizationHandler, CapabilityAuthorizationHandler>();
        }
    }
}
