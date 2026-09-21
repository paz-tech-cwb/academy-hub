namespace application.Dtos
{
    public class UnityResponseDto
    {
        public Guid PublicId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; } = string.Empty;
        public bool WasUnityCorrectlyAnswered { get; set; }
        public bool WasCertificateAlreadyIssued { get; set; }
    }
}
