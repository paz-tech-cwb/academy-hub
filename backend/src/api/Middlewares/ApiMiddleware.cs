using System.Net;
using System.Text.Json;

namespace api.Middlewares
{
    public class ApiMiddleware(RequestDelegate _next)
    {
        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                context.Response.ContentType = "application/json";
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

                var response = new
                {
                    context.Response.StatusCode,
                    Message = $"Erro interno do servidor: {ex.Message}",
                    ex.StackTrace,
                    ex.Source,
                    ex.InnerException
                };

                var options = new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                };

                await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
            }
        }
    }
}
