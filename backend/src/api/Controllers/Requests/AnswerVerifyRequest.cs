using domain.Dtos.Publics;
using System.Web;

namespace api.Controllers.Requests
{
    public class AnswerVerifyRequest
    {
        public Guid PublicLessonId { get; set; }
        public required string UnityName
        {
            get { return _unityName; }
            set { _unityName = HttpUtility.UrlDecode(value); }
        }
        private string _unityName = string.Empty;
        public List<PublicAnswerDto> Answers { get; set; } = [];
    }
}