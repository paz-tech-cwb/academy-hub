using System.ComponentModel;

namespace api.Controllers.Requests
{
    public class AttachCapabilityRequest
    {
        [Description("Identificador público da funcionalidade a vincular")]
        public Guid CapabilityPublicId { get; set; }
    }
}
