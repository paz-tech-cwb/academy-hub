using FluentValidation;

namespace api.Controllers.Requests.Validators
{
    public class CreateAlternativeRequestValidator : AbstractValidator<CreateAlternativeRequest>
    {
        public CreateAlternativeRequestValidator()
        {
            RuleFor(x => x.QuestionPublicId)
                .NotEmpty().WithMessage("O publicId da questão é obrigatório.");

            RuleFor(x => x.Text)
                .NotEmpty().WithMessage("O texto da alternativa é obrigatório.")
                .MaximumLength(5000).WithMessage("O texto deve ter no máximo 5000 caracteres.");
        }
    }
}