using System.Net;
using application.Dtos;
using domain.Interfaces.Repositories;

namespace application.UseCases
{
    public class DeleteLessonUseCase(
        ILessonRepository lessonRepository,
        IQuestionRepository questionRepository,
        IAlternativeRepository alternativeRepository,
        IAnswerRepository answerRepository)
    {
        public async Task<UseCaseResult<object>> ExecuteAsync(Guid publicId)
        {
            var lesson = await lessonRepository.GetAsync(l => l.PublicId == publicId);
            if (lesson is null)
                return new() { StatusCode = HttpStatusCode.NotFound };

            var answers = await answerRepository.GetListAsync(a => a.LessonId == lesson.Id);
            var alternatives = await alternativeRepository.GetListAsync(a => a.Question.LessonId == lesson.Id);
            var questions = await questionRepository.GetListAsync(q => q.LessonId == lesson.Id);

            if (answers.Count > 0) await answerRepository.DeleteRangeAsync(answers);
            if (alternatives.Count > 0) await alternativeRepository.DeleteRangeAsync(alternatives);
            if (questions.Count > 0) await questionRepository.DeleteRangeAsync(questions);

            await lessonRepository.DeleteAsync(lesson);

            return new();
        }
    }
}