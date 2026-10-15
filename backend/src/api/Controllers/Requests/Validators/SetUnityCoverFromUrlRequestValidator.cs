using FluentValidation;

namespace api.Controllers.Requests.Validators
{
    public class SetUnityCoverFromUrlRequestValidator : AbstractValidator<SetUnityCoverFromUrlRequest>
    {
        public SetUnityCoverFromUrlRequestValidator()
        {
            RuleFor(x => x.Url)
                .NotEmpty().WithMessage("Informe a URL da imagem.")
                .MaximumLength(2048).WithMessage("A URL deve ter no máximo 2048 caracteres.")
                .Must(BeHttpUrl).WithMessage("Informe uma URL válida começando com http:// ou https://.");

            RuleFor(x => x.CropX)
                .GreaterThanOrEqualTo(0).WithMessage("A posição do recorte não pode ser negativa.");

            RuleFor(x => x.CropY)
                .GreaterThanOrEqualTo(0).WithMessage("A posição do recorte não pode ser negativa.");

            RuleFor(x => x.CropWidth)
                .GreaterThan(0).WithMessage("A largura do recorte deve ser maior que zero.");

            RuleFor(x => x.CropHeight)
                .GreaterThan(0).WithMessage("A altura do recorte deve ser maior que zero.");
        }

        /// <summary>
        /// Verifica se o texto é uma URL absoluta com esquema http ou https.
        /// </summary>
        /// <param name="url">Texto informado.</param>
        /// <returns><c>true</c> se for uma URL http(s) válida.</returns>
        private static bool BeHttpUrl(string url) =>
            Uri.TryCreate(url, UriKind.Absolute, out var uri)
            && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }
}
