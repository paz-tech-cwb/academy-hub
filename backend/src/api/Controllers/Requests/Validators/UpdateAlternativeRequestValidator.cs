using FluentValidation;

namespace api.Controllers.Requests.Validators
{
    public class UpdateAlternativeRequestValidator : AbstractValidator<UpdateAlternativeRequest>
    {
        public UpdateAlternativeRequestValidator()
        {
            RuleFor(x => x.Text)
                .NotEmpty().WithMessage("O texto da alternativa é obrigatório.")
                .MaximumLength(5000).WithMessage("O texto deve ter no máximo 5000 caracteres.");
        }
    }
}