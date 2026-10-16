using FluentValidation;

namespace api.Controllers.Requests.Validators
{
    public class UpdateMyProfileRequestValidator : AbstractValidator<UpdateMyProfileRequest>
    {
        public UpdateMyProfileRequestValidator()
        {
            RuleFor(x => x.AboutMe)
                .MaximumLength(1000).WithMessage("O \"sobre mim\" deve ter no máximo 1000 caracteres.");

            RuleFor(x => x.Instagram)
                .MaximumLength(255).WithMessage("O Instagram deve ter no máximo 255 caracteres.");

            RuleFor(x => x.Email)
                .MaximumLength(255).WithMessage("O e-mail deve ter no máximo 255 caracteres.")
                .EmailAddress().WithMessage("Informe um e-mail válido.")
                .When(x => !string.IsNullOrWhiteSpace(x.Email));
        }
    }
}
