using FluentValidation;

namespace api.Controllers.Requests.Validators
{
    public class UpdateQuestionRequestValidator : AbstractValidator<UpdateQuestionRequest>
    {
        public UpdateQuestionRequestValidator()
        {
            RuleFor(x => x.Statement)
                .NotEmpty().WithMessage("O enunciado da questão é obrigatório.")
                .MaximumLength(5000).WithMessage("O enunciado deve ter no máximo 5000 caracteres.");
        }
    }
}