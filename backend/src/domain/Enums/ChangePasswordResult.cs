using System.ComponentModel;

namespace domain.Enums
{
    /// <summary>
    /// Desfecho da troca de senha feita pelo próprio usuário. Separa "não
    /// achei o usuário" de "a senha atual está errada", que viram 404 e 400 no
    /// controller.
    /// </summary>
    public enum ChangePasswordResult
    {
        [Description("Senha alterada com sucesso")]
        Success,

        [Description("Usuário do token não existe mais")]
        UserNotFound,

        [Description("A senha atual informada está incorreta")]
        InvalidCurrentPassword
    }
}
