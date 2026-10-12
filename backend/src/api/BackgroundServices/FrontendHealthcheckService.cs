namespace api.BackgroundServices
{
    /// <summary>
    /// Pinga a página de healthcheck do front a cada 3 minutos. Como essa
    /// página chama /api/health do lado do servidor, as duas aplicações
    /// acabam se chamando mutuamente e nenhuma das duas instâncias do Render
    /// hiberna por inatividade.
    /// </summary>
    public class FrontendHealthcheckService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<FrontendHealthcheckService> logger) : BackgroundService
    {
        private static readonly TimeSpan Interval = TimeSpan.FromMinutes(3);

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var url = configuration["Healthcheck:FrontendUrl"];

            if (string.IsNullOrWhiteSpace(url))
            {
                logger.LogInformation(
                    "Healthcheck:FrontendUrl não configurada; ping no front desativado.");
                return;
            }

            using var timer = new PeriodicTimer(Interval);

            do
            {
                await PingAsync(url, stoppingToken);
            }
            while (await timer.WaitForNextTickAsync(stoppingToken));
        }

        private async Task PingAsync(string url, CancellationToken stoppingToken)
        {
            try
            {
                var client = httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(30);

                using var response = await client.GetAsync(url, stoppingToken);

                logger.LogInformation(
                    "Ping no front {Url} respondeu {StatusCode}.",
                    url,
                    (int)response.StatusCode);
            }
            // O cancelamento do shutdown sobe para encerrar o serviço; qualquer
            // outra falha (front dormindo, timeout, DNS) só vira log.
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                logger.LogWarning(ex, "Ping no front {Url} falhou.", url);
            }
        }
    }
}
