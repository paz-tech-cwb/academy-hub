using application.Dtos;
using domain.Dtos;
using domain.Interfaces.Repositories;

namespace application.UseCases
{
    public class GetQuestionnaireUseCase(ILessonRepository _lessonRepository, IQuestionRepository _questionRepository)
    {
        public async Task<UseCaseResult<IEnumerable<QuestionDtoResponse>>> ExecuteAsync(string unityName, string lessonName)
        {
            var lessonFromDb = await _lessonRepository.GetAsync(u => u.Title == lessonName && u.Unity.Name == unityName);
            if (lessonFromDb is null) return new();

            var questionsFromDb = await _questionRepository.GetListAsync(lessonFromDb.Id);

            return new()
            {
                Content = questionsFromDb.Select(question => new QuestionDtoResponse
                {
                    PublicId = question.PublicId,
                    Statement = question.Statement,
                    Alternatives = question.Alternatives.Select(alt => new AlternativeDtoOut
                    {
                        PublicId = alt.PublicId,
                        Text = alt.Text
                    })
                }),
            };
        }
    }
}