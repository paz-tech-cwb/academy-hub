using FluentValidation;

namespace api.Controllers.Requests.Validators
{
    public class UpdateLessonRequestValidator : AbstractValidator<UpdateLessonRequest>
    {
        public UpdateLessonRequestValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("O título da aula é obrigatório.")
                .MaximumLength(100).WithMessage("O título da aula deve ter no máximo 100 caracteres.");

            RuleFor(x => x.Description)
                .MaximumLength(5000).WithMessage("A descrição deve ter no máximo 5000 caracteres.");

            RuleFor(x => x.Sequence)
                .GreaterThanOrEqualTo(0).WithMessage("A sequência não pode ser negativa.");

            RuleFor(x => x.VideoUrl)
                .MaximumLength(255).WithMessage("A URL do vídeo deve ter no máximo 255 caracteres.")
                .Must(BeValidUrl).WithMessage("A URL do vídeo informada não é válida.")
                .When(x => !string.IsNullOrWhiteSpace(x.VideoUrl));
        }

        private static bool BeValidUrl(string url)
            => Uri.TryCreate(url, UriKind.Absolute, out var uri)
                && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }
}