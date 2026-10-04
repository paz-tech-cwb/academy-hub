using FluentValidation;

namespace api.Controllers.Requests.Validators
{
    public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
    {
        public ResetPasswordRequestValidator()
        {
            RuleFor(x => x.NewPassword)
                .Cascade(CascadeMode.Stop)
                .NotEmpty().WithMessage("A senha é obrigatória.")
                .MinimumLength(8).WithMessage("A senha deve ter no mínimo 8 caracteres.")
                .MaximumLength(16).WithMessage("A senha deve ter no máximo 16 caracteres.")
                .SemAcentos("A senha não pode conter caracteres com acento.");
        }
    }
}