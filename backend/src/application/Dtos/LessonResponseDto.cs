using System.ComponentModel;

namespace application.Dtos
{
    public class LessonResponseDto
    {
        public Guid PublicId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? VideoUrl { get; set; }
        public int Sequence { get; set; }
        public bool Concluded { get; set; }

        [Description("Indica se a aula aceita respostas. É falso quando a unidade da aula está inativa.")]
        public bool AcceptsAnswers { get; set; }

        [Description("XP que o usuário ganha se acertar agora todas as questões da aula. Quando a aula já foi concluída, é o XP que ele ganhou.")]
        public int CurrentPointsWeight { get; set; }

        [Description("XP que a aula vale enquanto o usuário não errou nenhuma resposta.")]
        public int MaxPointsWeight { get; set; }

        [Description("XP descontado do prêmio da aula a cada resposta errada.")]
        public int PointsLostPerWrongAnswer { get; set; }

        [Description("XP mínimo que a aula vale, por mais respostas erradas que o usuário tenha dado.")]
        public int MinPointsWeight { get; set; }
    }
}
