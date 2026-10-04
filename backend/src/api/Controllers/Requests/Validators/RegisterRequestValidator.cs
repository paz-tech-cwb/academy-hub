using FluentValidation;

namespace api.Controllers.Requests.Validators
{
    public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
    {
        public RegisterRequestValidator()
        {
            RuleFor(x => x.Username)
                .Cascade(CascadeMode.Stop)
                .NotEmpty().WithMessage("O nome de usuário é obrigatório.")
                .MinimumLength(4).WithMessage("O nome de usuário deve ter no mínimo 4 caracteres.")
                .MaximumLength(16).WithMessage("O nome de usuário deve ter no máximo 16 caracteres.")
                .Matches("^[a-zA-Z0-9_-]+$").WithMessage("O nome de usuário aceita apenas letras, números, hífen (-) e underscore (_).");

            RuleFor(x => x.Password)
                .Cascade(CascadeMode.Stop)
                .NotEmpty().WithMessage("A senha é obrigatória.")
                .MinimumLength(8).WithMessage("A senha deve ter no mínimo 8 caracteres.")
                .MaximumLength(16).WithMessage("A senha deve ter no máximo 16 caracteres.")
                .SemAcentos("A senha não pode conter caracteres com acento.");
        }
    }
}