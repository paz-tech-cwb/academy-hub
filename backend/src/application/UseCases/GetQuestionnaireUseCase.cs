using application.Dtos;
using domain.Dtos;
using domain.Interfaces.Repositories;
using domain.Interfaces.Services;

namespace application.UseCases
{
    public class GetQuestionnaireUseCase(ILessonRepository _lessonRepository, IQuestionRepository _questionRepository, IAnswerService _answerService)
    {
        /// <summary>
        /// Lista as questões de uma aula junto com a última resposta que o usuário deu em cada uma.
        /// </summary>
        /// <param name="unityName">Nome da unidade.</param>
        /// <param name="lessonName">Título da aula.</param>
        /// <param name="publicUserId">Id público do usuário autenticado.</param>
        /// <returns>Questões da aula; as que o usuário ainda não respondeu vêm com os campos de última resposta nulos.</returns>
        public async Task<UseCaseResult<IEnumerable<QuestionDtoResponse>>> ExecuteAsync(string unityName, string lessonName, Guid publicUserId)
        {
            var lessonFromDb = await _lessonRepository.GetAsync(u => u.Title == lessonName && u.Unity.Name == unityName);
            if (lessonFromDb is null) return new();

            var questionsFromDb = await _questionRepository.GetListAsync(lessonFromDb.Id);
            var lastAnswers = await _answerService.GetLastAnswersAsync(publicUserId, lessonFromDb.PublicId);
            var lastAnswerByQuestion = lastAnswers.Answers.ToDictionary(a => a.PublicQuestionId);

            return new()
            {
                Content = questionsFromDb.Select(question =>
                {
                    lastAnswerByQuestion.TryGetValue(question.PublicId, out var lastAnswer);

                    return new QuestionDtoResponse
                    {
                        PublicId = question.PublicId,
                        Statement = question.Statement,
                        Alternatives = question.Alternatives.Select(alt => new AlternativeDtoOut
                        {
                            PublicId = alt.PublicId,
                            Text = alt.Text
                        }),
                        LastSelectedAlternativeId = lastAnswer?.PublicAlternativeId,
                        LastAnswerIsCorrect = lastAnswer?.IsCorrect,
                    };
                }),
            };
        }
    }
}
