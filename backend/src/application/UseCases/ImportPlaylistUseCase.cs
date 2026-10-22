using application.Dtos;
using domain.Constants;
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
                Description = LimitDescription(playlist.Description)
            });

            var lessons = playlist.Videos.Select((video, i) => new Lesson
            {
                Title = video.Title,
                Description = LimitDescription(video.Description),
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

        /// <summary>
        /// Corta a descrição vinda do YouTube no tamanho máximo aceito pelo banco.
        /// </summary>
        /// <param name="description">Descrição original da playlist ou do vídeo.</param>
        /// <returns>A descrição com no máximo <see cref="ContentLimits.DescriptionMaxLength"/> caracteres.</returns>
        private static string? LimitDescription(string? description)
            => description is { Length: > ContentLimits.DescriptionMaxLength }
                ? description[..ContentLimits.DescriptionMaxLength]
                : description;
    }
}