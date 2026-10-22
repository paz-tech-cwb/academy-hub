namespace api.Jobs
{
    /// <summary>
    /// Job recorrente que pinga a página de healthcheck do front. Como essa
    /// página chama /api/health do lado do servidor, as duas aplicações
    /// acabam se chamando mutuamente e nenhuma das duas instâncias do Render
    /// hiberna por inatividade.
    /// </summary>
    public class FrontendHealthcheckJob(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<FrontendHealthcheckJob> logger)
    {
        public const string Id = "frontend-healthcheck";
        public const string FrontendUrlKey = "Healthcheck:FrontendUrl";
        public const string EveryThreeMinutesFrom17To23 = "*/3 17-22 * * *";
        public const string TimeZoneId = "America/Sao_Paulo";

        private static readonly TimeSpan RequestTimeout = TimeSpan.FromSeconds(30);

        /// <summary>
        /// Faz um GET na URL de healthcheck do front e registra o status da resposta.
        /// Falhas na chamada (front dormindo, timeout, DNS) viram apenas um aviso no log,
        /// sem marcar o job como falho; só o cancelamento por shutdown é propagado.
        /// </summary>
        /// <param name="cancellationToken">Token cancelado pelo Hangfire quando a aplicação está encerrando.</param>
        public async Task ExecuteAsync(CancellationToken cancellationToken)
        {
            var url = configuration[FrontendUrlKey];

            if (string.IsNullOrWhiteSpace(url))
                return;

            try
            {
                var client = httpClientFactory.CreateClient();
                client.Timeout = RequestTimeout;

                using var response = await client.GetAsync(url, cancellationToken);

                logger.LogInformation(
                    "Ping no front {Url} respondeu {StatusCode}.",
                    url,
                    (int)response.StatusCode);
            }
            catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
            {
                logger.LogWarning(ex, "Ping no front {Url} falhou.", url);
            }
        }
    }
}
