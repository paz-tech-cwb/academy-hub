namespace api.Controllers.Responses
{
    public class GetLessonsResponse
    {
        public Guid PublicId { get; set; }
        public string Title { get; set; } = string.Empty;
        public int Sequence { get; set; }
        public bool Concluded { get; set; }
    }
}