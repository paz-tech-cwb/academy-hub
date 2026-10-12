using FluentValidation;

namespace api.Controllers.Requests.Validators
{
    public class CreateRoleRequestValidator : AbstractValidator<CreateRoleRequest>
    {
        public CreateRoleRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("O nome da função é obrigatório.")
                .MaximumLength(50).WithMessage("O nome da função deve ter no máximo 50 caracteres.");

            RuleFor(x => x.Description)
                .MaximumLength(255).WithMessage("A descrição deve ter no máximo 255 caracteres.");
        }
    }
}
