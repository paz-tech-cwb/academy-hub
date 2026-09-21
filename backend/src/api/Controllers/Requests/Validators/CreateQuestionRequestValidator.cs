using FluentValidation;

namespace api.Controllers.Requests.Validators
{
    public class CreateQuestionRequestValidator : AbstractValidator<CreateQuestionRequest>
    {
        public CreateQuestionRequestValidator()
        {
            RuleFor(x => x.LessonPublicId)
                .NotEmpty().WithMessage("O publicId da aula é obrigatório.");

            RuleFor(x => x.Statement)
                .NotEmpty().WithMessage("O enunciado da questão é obrigatório.")
                .MaximumLength(5000).WithMessage("O enunciado deve ter no máximo 5000 caracteres.");
        }
    }
}