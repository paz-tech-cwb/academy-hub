using System.ComponentModel;

namespace application.Dtos
{
    public class UnityProgressResponse
    {
        [Description("Id público da unidade.")]
        public Guid UnityPublicId { get; set; }

        [Description("Nome da unidade.")]
        public string UnityName { get; set; } = string.Empty;

        [Description("Quantidade de aulas da unidade.")]
        public int TotalLessons { get; set; }

        [Description("Quantidade de aulas que o usuário já concluiu na unidade.")]
        public int ConcludedLessons { get; set; }

        [Description("Título da primeira aula, na ordem da unidade, que o usuário ainda não concluiu. Nulo quando todas foram concluídas.")]
        public string? NextLessonTitle { get; set; }

        [Description("Data da última resposta do usuário em alguma aula da unidade. Nula quando ele ainda não respondeu nada nela.")]
        public DateTime? LastActivityAt { get; set; }
    }
}
