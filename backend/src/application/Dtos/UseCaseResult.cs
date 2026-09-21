using System.ComponentModel;
using System.Net;

namespace application.Dtos
{
    [Description("Objeto padrão retornado por todos os endpoints")]
    public class UseCaseResult<T>
    {
        [Description("Conteúdo da resposta")]
        public T? Content { get; set; }

        [Description("HttpStatus da resposta")]
        public HttpStatusCode StatusCode { get; set; } = HttpStatusCode.OK;
    }
}