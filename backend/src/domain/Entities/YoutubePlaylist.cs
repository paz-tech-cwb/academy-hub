namespace domain.Entities
{
    public class YoutubePlaylist
    {
        public required string Url { get; set; }
        public required string Title { get; set; }
        public string? Description { get; set; }
        public List<Video> Videos { get; set; } = [];

        public class Video
        {
            public required string Title { get; set; }
            public required string Url { get; set; }
            public string? Description { get; set; }
        }
    }
}
