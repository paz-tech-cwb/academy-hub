using System.ComponentModel;

namespace application.Dtos
{
    /// <summary>
    /// Corpo das respostas 4xx. O <c>getApiErrorMessage</c> do front lê
    /// <c>data.message</c>, então é por aqui que a mensagem chega na UI.
    /// </summary>
    [Description("Mensagem explicando por que a operação não foi concluída")]
    public class MessageResponse
    {
        [Description("Mensagem a ser exibida ao usuário")]
        public string Message { get; set; } = string.Empty;
    }
}
