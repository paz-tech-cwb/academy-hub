namespace application.Dtos
{
    public class GetUnitiesResponse
    {
        public Guid PublicId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; } = string.Empty;
        public string? UnityCover { get; set; } = string.Empty;
    }
}
