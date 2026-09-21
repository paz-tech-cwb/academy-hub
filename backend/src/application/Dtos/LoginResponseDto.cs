namespace application.Dtos
{
    public class LoginResponseDto
    {
        public bool IsLogged { get; set; }
        public string AccessToken { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public DateTime? ExpiresIn { get; set; }
        public required string Message { get; set; }
    }
}