namespace domain.Constants
{
    /// <summary>
    /// Regras de XP do questionário de uma aula.
    /// </summary>
    public static class LessonPoints
    {
        /// <summary>
        /// XP que a aula vale enquanto o usuário não errou nenhuma resposta.
        /// </summary>
        public const int Max = 300;

        /// <summary>
        /// XP descontado do prêmio da aula a cada resposta errada.
        /// </summary>
        public const int LostPerWrongAnswer = 50;

        /// <summary>
        /// XP mínimo que a aula vale, por mais respostas erradas que o usuário tenha dado.
        /// </summary>
        public const int Min = 50;
    }
}
