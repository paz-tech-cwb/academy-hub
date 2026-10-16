using domain.Enums;
using domain.Interfaces.Repositories;
using domain.Interfaces.Services;
using domain.Models;

namespace application.Services
{
    /// <summary>
    /// Regras comuns às fotos de perfil: limites, validação de proporção e gravação no bucket
    /// em <c>profile-pics/{publicId}.{ext}</c>.
    /// </summary>
    public class ProfilePicService(IStorageClient storageClient, IUserRepository userRepository)
    {
        public const long MaxPicBytes = 2 * 1024 * 1024;
        public const int MaxSize = 512;
        public const long MaxPixels = 40_000_000;

        public const string InvalidFormatMessage = "Envie uma imagem PNG, JPG ou WebP.";
        public const string TooLargeMessage = "A imagem deve ter no máximo 2 MB.";
        public const string TooManyPixelsMessage = "A resolução da imagem é grande demais.";
        public const string WrongRatioMessage = "A imagem precisa ser quadrada.";

        private const string Folder = "profile-pics";
        private const double RatioTolerance = 0.01;

        /// <summary>
        /// Verifica se as dimensões formam um quadrado, com tolerância de 1% para arredondamentos do recorte.
        /// </summary>
        /// <param name="width">Largura em pixels.</param>
        /// <param name="height">Altura em pixels.</param>
        /// <returns><c>true</c> se a imagem for quadrada.</returns>
        public static bool IsSquare(int width, int height) =>
            width > 0 && height > 0 && Math.Abs(width - height) <= height * RatioTolerance;

        /// <summary>
        /// Grava a foto no bucket, apaga a foto anterior se ela tinha outra extensão e atualiza
        /// <c>profile_pic_url</c> do usuário com a nova URL pública versionada.
        /// </summary>
        /// <param name="user">Usuário que receberá a foto.</param>
        /// <param name="content">Bytes da imagem final.</param>
        /// <param name="format">Formato da imagem, que define a extensão e o content-type.</param>
        /// <returns>A nova URL pública da foto.</returns>
        public async Task<string> SaveAsync(User user, byte[] content, ImageFormat format)
        {
            var (extension, contentType) = format switch
            {
                ImageFormat.Png => ("png", "image/png"),
                ImageFormat.Jpeg => ("jpg", "image/jpeg"),
                ImageFormat.Webp => ("webp", "image/webp"),
                _ => throw new ArgumentOutOfRangeException(nameof(format))
            };

            var key = $"{Folder}/{user.PublicId}.{extension}";
            await storageClient.UploadAsync(key, content, contentType);

            var previousKey = GetCurrentKey(user);
            if (previousKey is not null && previousKey != key)
                await storageClient.DeleteAsync(previousKey);

            user.ProfilePicUrl = $"{storageClient.GetPublicUrl(key)}?v={DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
            await userRepository.UpdateAsync(user);

            return user.ProfilePicUrl;
        }

        /// <summary>
        /// Remove a foto do usuário do bucket e limpa <c>profile_pic_url</c>. Não faz nada se o usuário não tiver foto.
        /// </summary>
        /// <param name="user">Usuário cuja foto será removida.</param>
        public async Task RemoveAsync(User user)
        {
            if (string.IsNullOrWhiteSpace(user.ProfilePicUrl)) return;

            var key = GetCurrentKey(user);
            if (key is not null) await storageClient.DeleteAsync(key);

            user.ProfilePicUrl = null;
            await userRepository.UpdateAsync(user);
        }

        /// <summary>
        /// Obtém a chave do objeto da foto atual a partir de <c>profile_pic_url</c>.
        /// </summary>
        /// <param name="user">Usuário.</param>
        /// <returns>A chave no bucket, ou <c>null</c> se o usuário não tiver foto ou ela não estiver no bucket.</returns>
        private string? GetCurrentKey(User user)
        {
            // A foto pode ser uma URL externa gravada direto no banco; essa não tem arquivo nosso para apagar.
            if (string.IsNullOrWhiteSpace(user.ProfilePicUrl)
                || !user.ProfilePicUrl.StartsWith(storageClient.GetPublicUrl($"{Folder}/"), StringComparison.OrdinalIgnoreCase))
                return null;

            return storageClient.GetKeyFromPublicUrl(user.ProfilePicUrl);
        }
    }
}
