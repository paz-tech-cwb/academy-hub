using domain.Models;

namespace domain.Interfaces.Repositories
{
    public interface ILessonRepository : IBaseRepository<Lesson>
    {
        public Task<Lesson?> GetLesson(Guid publicId);
        
        /// <summary>
        /// Busca uma aula, com questões e alternativas, pelo título e pelo nome da unidade.
        /// </summary>
        /// <param name="unityName">Nome da unidade.</param>
        /// <param name="lessonName">Título da aula.</param>
        /// <param name="includeInactiveUnity">Quando <c>true</c>, também encontra aulas de unidades inativas.</param>
        /// <returns>A aula, ou <c>null</c> quando não é encontrada.</returns>
        public Task<Lesson?> GetLesson(string unityName, string lessonName, bool includeInactiveUnity);
    }
}