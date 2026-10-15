using domain.Enums;
using domain.Interfaces.Repositories;
using domain.Interfaces.Services;
using domain.Models;

namespace application.Services
{
    /// <summary>
    /// Regras comuns às capas de unidade: limites, validação de proporção e gravação no bucket
    /// em <c>unities/{publicId}.{ext}</c>.
    /// </summary>
    public class UnityCoverService(IStorageClient storageClient, IUnityRepository unityRepository)
    {
        public const long MaxCoverBytes = 2 * 1024 * 1024;
        public const int MaxWidth = 1920;
        public const int MaxHeight = 1080;
        public const long MaxPixels = 40_000_000;

        public const string InvalidFormatMessage = "Envie uma imagem PNG, JPG ou WebP.";
        public const string TooLargeMessage = "A imagem deve ter no máximo 2 MB.";
        public const string TooManyPixelsMessage = "A resolução da imagem é grande demais.";
        public const string WrongRatioMessage = "A imagem precisa estar na proporção 16:9.";

        private const string Folder = "unities";
        private const double RatioTolerance = 0.01;

        /// <summary>
        /// Verifica se as dimensões estão na proporção 16:9, com tolerância de 1% para arredondamentos do recorte.
        /// </summary>
        /// <param name="width">Largura em pixels.</param>
        /// <param name="height">Altura em pixels.</param>
        /// <returns><c>true</c> se a proporção for 16:9.</returns>
        public static bool Is16By9(int width, int height) =>
            width > 0 && height > 0 && Math.Abs(width * 9d - height * 16d) <= height * 16d * RatioTolerance;

        /// <summary>
        /// Grava a capa no bucket, apaga a capa anterior se ela tinha outra extensão e atualiza
        /// <c>cover_url</c> da unidade com a nova URL pública versionada.
        /// </summary>
        /// <param name="unity">Unidade que receberá a capa.</param>
        /// <param name="content">Bytes da imagem final.</param>
        /// <param name="format">Formato da imagem, que define a extensão e o content-type.</param>
        /// <returns>A nova URL pública da capa.</returns>
        public async Task<string> SaveAsync(Unity unity, byte[] content, ImageFormat format)
        {
            var (extension, contentType) = format switch
            {
                ImageFormat.Png => ("png", "image/png"),
                ImageFormat.Jpeg => ("jpg", "image/jpeg"),
                ImageFormat.Webp => ("webp", "image/webp"),
                _ => throw new ArgumentOutOfRangeException(nameof(format))
            };

            var key = $"{Folder}/{unity.PublicId}.{extension}";
            await storageClient.UploadAsync(key, content, contentType);

            var previousKey = GetCurrentKey(unity);
            if (previousKey is not null && previousKey != key)
                await storageClient.DeleteAsync(previousKey);

            unity.CoverUrl = $"{storageClient.GetPublicUrl(key)}?v={DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
            await unityRepository.UpdateAsync(unity);

            return unity.CoverUrl;
        }

        /// <summary>
        /// Remove a capa da unidade do bucket e limpa <c>cover_url</c>. Não faz nada se a unidade não tiver capa.
        /// </summary>
        /// <param name="unity">Unidade cuja capa será removida.</param>
        public async Task RemoveAsync(Unity unity)
        {
            var key = GetCurrentKey(unity);
            if (key is null) return;

            await storageClient.DeleteAsync(key);
            unity.CoverUrl = null;
            await unityRepository.UpdateAsync(unity);
        }

        /// <summary>
        /// Apaga do bucket o arquivo de capa da unidade, sem alterar o banco. Usado quando a
        /// própria unidade está sendo excluída.
        /// </summary>
        /// <param name="unity">Unidade excluída.</param>
        public async Task DeleteFileAsync(Unity unity)
        {
            var key = GetCurrentKey(unity);
            if (key is not null) await storageClient.DeleteAsync(key);
        }

        /// <summary>
        /// Obtém a chave do objeto da capa atual a partir de <c>cover_url</c>.
        /// </summary>
        /// <param name="unity">Unidade.</param>
        /// <returns>A chave no bucket, ou <c>null</c> se a unidade não tiver capa.</returns>
        private string? GetCurrentKey(Unity unity) =>
            string.IsNullOrWhiteSpace(unity.CoverUrl) ? null : storageClient.GetKeyFromPublicUrl(unity.CoverUrl);
    }
}
