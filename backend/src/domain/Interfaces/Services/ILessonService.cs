namespace domain.Interfaces.Services;

public interface ILessonService
{
    Task<bool> LessonAreAlreadyAnswered(Guid publicUserId, Guid publicLessonId);
}
