using System.Globalization;
using System.Text;
using FluentValidation;

namespace api.Controllers.Requests.Validators
{
    internal static class ValidationRules
    {
        /// <summary>
        /// Impede que o valor contenha caracteres acentuados. A checagem normaliza
        /// para <see cref="NormalizationForm.FormD"/> e procura por marcas de combinação
        /// (NonSpacingMark), que é como todo caractere acentuado se decompõe.
        /// </summary>
        public static IRuleBuilderOptions<T, string> SemAcentos<T>(this IRuleBuilder<T, string> ruleBuilder, string message)
            => ruleBuilder.Must(valor => !PossuiAcentos(valor)).WithMessage(message);

        private static bool PossuiAcentos(string valor)
        {
            if (string.IsNullOrEmpty(valor)) return false;

            return valor
                .Normalize(NormalizationForm.FormD)
                .Any(caractere => CharUnicodeInfo.GetUnicodeCategory(caractere) == UnicodeCategory.NonSpacingMark);
        }
    }
}