using FluentValidation;

namespace api.Controllers.Requests.Validators
{
    public class UpdateUnityRequestValidator : AbstractValidator<UpdateUnityRequest>
    {
        public UpdateUnityRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("O nome da unidade é obrigatório.")
                .MaximumLength(255).WithMessage("O nome da unidade deve ter no máximo 255 caracteres.");

            RuleFor(x => x.Description)
                .MaximumLength(5000).WithMessage("A descrição deve ter no máximo 5000 caracteres.");
        }
    }
}