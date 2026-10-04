using FluentValidation;

namespace api.Controllers.Requests.Validators
{
    public class ReorderLessonsRequestValidator : AbstractValidator<ReorderLessonsRequest>
    {
        public ReorderLessonsRequestValidator()
        {
            RuleFor(x => x.Lessons)
                .NotEmpty().WithMessage("É necessário enviar ao menos uma aula.")
                .Must(x => x.Select(l => l.PublicId).Distinct().Count() == x.Count)
                    .WithMessage("A mesma aula não pode ser enviada mais de uma vez.")
                .Must(x => x.Select(l => l.Sequence).Distinct().Count() == x.Count)
                    .WithMessage("As posições enviadas devem ser distintas.");
        }
    }
}