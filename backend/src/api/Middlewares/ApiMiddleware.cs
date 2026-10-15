using System.Diagnostics;
using System.Net;
using System.Text.Json;

namespace api.Middlewares
{
    public class ApiMiddleware(RequestDelegate _next, ILogger<ApiMiddleware> _logger)
    {
        private const string FriendlyMessage = "Ocorreu um erro inesperado. Tente novamente em instantes.";

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        /// <summary>
        /// Executa o restante do pipeline e, se uma exceção não tratada escapar, registra os detalhes
        /// no log e responde 500 apenas com uma mensagem amigável e o id de rastreio da requisição,
        /// sem expor stack trace nem mensagens internas.
        /// </summary>
        /// <param name="context">Contexto HTTP da requisição.</param>
        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                var traceId = Activity.Current?.TraceId.ToString() ?? context.TraceIdentifier;
                _logger.LogError(ex, "Erro não tratado em {Method} {Path} (traceId {TraceId}).",
                    context.Request.Method, context.Request.Path, traceId);

                // Se a resposta já começou a ser enviada, não dá mais para trocar status nem corpo.
                if (context.Response.HasStarted) throw;

                context.Response.Clear();
                context.Response.ContentType = "application/json";
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

                var response = new
                {
                    context.Response.StatusCode,
                    Message = FriendlyMessage,
                    TraceId = traceId
                };

                await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
            }
        }
    }
}
