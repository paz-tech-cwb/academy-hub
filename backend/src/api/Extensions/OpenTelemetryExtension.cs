using OpenTelemetry.Exporter;
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace api.Extensions
{

    public static class OpenTelemetryExtension
    {
        private static Action<OtlpExporterOptions> ConfigureOtlp(string endpoint, ConfigurationManager configuration)
        {
            return otlp =>
            {
                otlp.Protocol = OtlpExportProtocol.HttpProtobuf;
                otlp.Endpoint = new Uri(endpoint);
                otlp.Headers = $"Authorization=Basic {configuration["OpenObserver:Token"]},stream-name=default";
            };
        }

        public static void AddOpenTelemetryExtension(this WebApplicationBuilder _builder)
        {
            var configuration = _builder.Configuration;
            var baseEndpoint = configuration["OpenObserver:BaseUrl"];
            var resource = ResourceBuilder.CreateDefault().AddService("academy-hub-api");

            _builder.Logging.ClearProviders();
            _builder.Logging.AddConsole();
            _builder.Logging.SetMinimumLevel(LogLevel.Information);
            _builder.Logging.AddOpenTelemetry(options =>
            {
                options.SetResourceBuilder(resource);
                options.AddOtlpExporter(ConfigureOtlp($"{baseEndpoint}/v1/logs", configuration));
            });

            _builder.Services.AddOpenTelemetry()
                .WithTracing(options =>
                {
                    options
                        .SetResourceBuilder(resource)
                        .AddAspNetCoreInstrumentation()
                        .AddHttpClientInstrumentation()
                        .AddOtlpExporter(ConfigureOtlp($"{baseEndpoint}/v1/traces", configuration))
                        .AddEntityFrameworkCoreInstrumentation();
                }).WithMetrics(options =>
                {
                    options
                        .SetResourceBuilder(resource)
                        .AddAspNetCoreInstrumentation()
                        .AddHttpClientInstrumentation()
                        .AddRuntimeInstrumentation()
                        .AddOtlpExporter(ConfigureOtlp($"{baseEndpoint}/v1/metrics", configuration));
                });

        }
    }
}
