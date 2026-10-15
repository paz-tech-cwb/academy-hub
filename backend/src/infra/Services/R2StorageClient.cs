using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using domain.Interfaces.Services;

namespace infra.Services
{
    /// <summary>
    /// Credenciais e endereços do Cloudflare R2.
    /// </summary>
    /// <param name="AccountId">Id da conta Cloudflare, usado no endpoint S3.</param>
    /// <param name="AccessKeyId">Access Key ID do token R2.</param>
    /// <param name="SecretAccessKey">Secret Access Key do token R2.</param>
    /// <param name="BucketName">Nome do bucket.</param>
    /// <param name="PublicUrl">URL pública do bucket (Public Development URL ou domínio próprio).</param>
    public record R2Settings(string AccountId, string AccessKeyId, string SecretAccessKey, string BucketName, string PublicUrl);

    /// <summary>
    /// Cliente do Cloudflare R2 pela API compatível com S3. Os objetos são lidos publicamente
    /// pela <see cref="R2Settings.PublicUrl"/>.
    /// </summary>
    public class R2StorageClient(R2Settings settings) : IStorageClient, IDisposable
    {
        // Criado no primeiro uso: sem as variáveis R2 configuradas, a API continua subindo e só as
        // operações de capa falham.
        private readonly Lazy<AmazonS3Client> _client = new(() => CreateClient(settings));
        private readonly string _bucketName = settings.BucketName;
        private readonly string _publicUrl = settings.PublicUrl.TrimEnd('/');


        /// <summary>
        /// Cria o cliente S3 apontando para o endpoint do R2 da conta configurada.
        /// </summary>
        /// <param name="settings">Credenciais e conta do R2.</param>
        /// <returns>Cliente S3 pronto para uso.</returns>
        private static AmazonS3Client CreateClient(R2Settings settings)
        {
            var credentials = new BasicAWSCredentials(settings.AccessKeyId, settings.SecretAccessKey);
            return new AmazonS3Client(credentials, new AmazonS3Config
            {
                ServiceURL = $"https://{settings.AccountId}.r2.cloudflarestorage.com",
                ForcePathStyle = true,
                AuthenticationRegion = "auto",
                RequestChecksumCalculation = RequestChecksumCalculation.WHEN_REQUIRED,
                ResponseChecksumValidation = ResponseChecksumValidation.WHEN_REQUIRED
            });
        }

        /// <summary>
        /// Envia um arquivo para o bucket, sobrescrevendo o objeto se a chave já existir.
        /// </summary>
        /// <param name="key">Caminho do objeto dentro do bucket.</param>
        /// <param name="content">Conteúdo do arquivo.</param>
        /// <param name="contentType">Content-type gravado no objeto.</param>
        public async Task UploadAsync(string key, byte[] content, string contentType)
        {
            using var stream = new MemoryStream(content);
            var request = new PutObjectRequest
            {
                BucketName = _bucketName,
                Key = key,
                InputStream = stream,
                ContentType = contentType,
                DisablePayloadSigning = true
            };
            // A URL gravada no banco leva ?v=, então cada versão da capa tem uma URL própria.
            request.Headers.CacheControl = "public, max-age=31536000";

            await _client.Value.PutObjectAsync(request);
        }

        /// <summary>
        /// Remove um objeto do bucket. Não falha se o objeto não existir.
        /// </summary>
        /// <param name="key">Caminho do objeto dentro do bucket.</param>
        public async Task DeleteAsync(string key)
        {
            await _client.Value.DeleteObjectAsync(_bucketName, key);
        }

        /// <summary>
        /// Monta a URL pública de um objeto do bucket.
        /// </summary>
        /// <param name="key">Caminho do objeto dentro do bucket.</param>
        /// <returns>URL pública, sem query string.</returns>
        public string GetPublicUrl(string key) => $"{_publicUrl}/{key}";

        /// <summary>
        /// Extrai a chave do objeto a partir de uma URL pública, ignorando a query string.
        /// </summary>
        /// <param name="publicUrl">URL pública do objeto.</param>
        /// <returns>Chave do objeto dentro do bucket.</returns>
        public string GetKeyFromPublicUrl(string publicUrl) =>
            Uri.UnescapeDataString(new Uri(publicUrl).AbsolutePath.TrimStart('/'));

        /// <summary>
        /// Libera o cliente HTTP interno do SDK.
        /// </summary>
        public void Dispose()
        {
            if (_client.IsValueCreated) _client.Value.Dispose();
            GC.SuppressFinalize(this);
        }
    }
}
