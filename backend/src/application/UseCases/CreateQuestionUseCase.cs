using System.Net;
using application.Dtos;
using domain.Interfaces.Repositories;
using domain.Models;

namespace application.UseCases
{
    public class CreateQuestionUseCase(
        ILessonRepository lessonRepository,
        IUnityRepository unityRepository,
        IQuestionRepository questionRepository)
    {
        public async Task<UseCaseResult<Question>> ExecuteAsync(Guid lessonPublicId, string statement)
        {
            var lesson = await lessonRepository.GetAsync(l => l.PublicId == lessonPublicId);
            if (lesson is null)
                return new() { StatusCode = HttpStatusCode.NotFound };

            var unity = await unityRepository.GetAsync(u => u.Id == lesson.UnityId);
            if (unity is null)
                return new() { StatusCode = HttpStatusCode.NotFound };

            var question = new Question
            {
                Statement = statement,
                LessonId = lesson.Id,
                UnityId = lesson.UnityId,
                Lesson = lesson,
                Unity = unity,
                Alternatives = []
            };

            var created = await questionRepository.InsertAsync(question);
            return new() { Content = created, StatusCode = HttpStatusCode.Created };
        }
    }
}