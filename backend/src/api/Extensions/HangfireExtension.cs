using api.Jobs;
using Hangfire;

namespace api.Extensions
{
    public static class HangfireExtension
    {
        /// <summary>
        /// Registra o Hangfire com armazenamento em memória e o servidor que processa os jobs.
        /// </summary>
        /// <param name="services">Coleção de serviços da aplicação.</param>
        public static void AddHangfireJobs(this IServiceCollection services)
        {
            services.AddHangfire(configuration => configuration
                .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
                .UseSimpleAssemblyNameTypeSerializer()
                .UseRecommendedSerializerSettings()
                .UseInMemoryStorage());

            services.AddHangfireServer();
        }

        /// <summary>
        /// Agenda os jobs recorrentes e, em Development, expõe o dashboard do Hangfire em /hangfire.
        /// </summary>
        /// <param name="app">Aplicação web já construída.</param>
        public static void UseHangfireJobs(this WebApplication app)
        {
            if (app.Environment.IsDevelopment())
                app.UseHangfireDashboard();

            ScheduleFrontendHealthcheck(app);
        }

        /// <summary>
        /// Agenda o ping no front a cada 3 minutos, das 17h às 23h no horário de Brasília,
        /// desde que a URL do healthcheck esteja configurada.
        /// </summary>
        /// <param name="app">Aplicação web já construída.</param>
        private static void ScheduleFrontendHealthcheck(WebApplication app)
        {
            if (string.IsNullOrWhiteSpace(app.Configuration[FrontendHealthcheckJob.FrontendUrlKey]))
            {
                app.Logger.LogInformation(
                    "{Key} não configurada; ping no front desativado.",
                    FrontendHealthcheckJob.FrontendUrlKey);
                return;
            }

            app.Services.GetRequiredService<IRecurringJobManager>()
                .AddOrUpdate<FrontendHealthcheckJob>(
                    FrontendHealthcheckJob.Id,
                    job => job.ExecuteAsync(CancellationToken.None),
                    FrontendHealthcheckJob.EveryThreeMinutesFrom17To23,
                    new RecurringJobOptions
                    {
                        TimeZone = TimeZoneInfo.FindSystemTimeZoneById(FrontendHealthcheckJob.TimeZoneId)
                    });
        }
    }
}
