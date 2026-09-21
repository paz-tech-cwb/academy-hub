using Microsoft.OpenApi;
using Scalar.AspNetCore;

namespace api.Extensions
{
    public static class ScalarExtension
    {
        public static void AddScalar(this IServiceCollection services)
        {
            services.AddControllers();

            services.AddOpenApi(options =>
            {
                options.AddDocumentTransformer((document, context, cancellationToken) =>
                {
                    document.Components ??= new OpenApiComponents();

                    document.Components.SecuritySchemes = new Dictionary<string, IOpenApiSecurityScheme>
                    {
                        ["Bearer"] = new OpenApiSecurityScheme
                        {
                            Type = SecuritySchemeType.Http,
                            Scheme = "bearer",
                            In = ParameterLocation.Header,
                            BearerFormat = "JWT"
                        }
                    };

                    document.Security ??= [];

                    document.Security.Add(new OpenApiSecurityRequirement
                    {
                        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
                    });

                    return Task.CompletedTask;
                });
            });
        }

        public static void UseScalar(this WebApplication app)
        {
            app.MapControllers();
            app.MapOpenApi();
            app.MapScalarApiReference("/", o =>
            {
                o.HideModels = true;
                o.Layout = ScalarLayout.Classic;
                o.Theme = ScalarTheme.Alternate;
            });
        }
    }
}
