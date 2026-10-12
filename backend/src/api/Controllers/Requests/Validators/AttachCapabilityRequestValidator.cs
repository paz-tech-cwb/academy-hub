using FluentValidation;

namespace api.Controllers.Requests.Validators
{
    public class AttachCapabilityRequestValidator : AbstractValidator<AttachCapabilityRequest>
    {
        public AttachCapabilityRequestValidator()
        {
            RuleFor(x => x.CapabilityPublicId)
                .NotEmpty().WithMessage("Informe a funcionalidade a vincular.");
        }
    }
}
