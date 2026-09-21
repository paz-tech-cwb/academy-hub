using domain.Entities;

namespace domain.Interfaces.Services
{
    public interface IPlaylistService
    {
        public YoutubePlaylist ScrapVideos(string playlistUrl);
    }
}
