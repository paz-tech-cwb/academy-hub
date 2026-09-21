using application.Dtos;
using domain.Interfaces.Services;
using domain.Interfaces.Repositories;
using domain.Models;

namespace application.UseCases
{
    public class ImportPlaylistUseCase(IPlaylistService playlistService, IUnityRepository unityRepository, ILessonRepository lessonRepository)
    {
        public async Task<UseCaseResult<string>> ExecuteAsync(string playlistUrl)
        {
            var playlist = playlistService.ScrapVideos(playlistUrl);

            var unity = await unityRepository.InsertAsync(new Unity
            {
                Name = playlist.Title,
                Description = playlist.Description
            });

            var lessons = playlist.Videos.Select((video, i) => new Lesson
            {
                Title = video.Title,
                Description = video.Description,
                Sequence = 1,
                VideoUrl = video.Url,
                UnityId = unity.Id,
                Unity = unity
            }).ToList();

            await lessonRepository.InsertRangeAsync(lessons);

            return new()
            {
                Content = "Vídeos importados com sucesso!"
            };
        }
    }
}