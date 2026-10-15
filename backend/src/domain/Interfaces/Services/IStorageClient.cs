namespace domain.Interfaces.Services
{
    public interface IStorageClient
    {
        /// <summary>
        /// Envia um arquivo para o bucket, sobrescrevendo o objeto se a chave já existir.
        /// </summary>
        /// <param name="key">Caminho do objeto dentro do bucket (ex.: <c>unities/{id}.png</c>).</param>
        /// <param name="content">Conteúdo do arquivo.</param>
        /// <param name="contentType">Content-type gravado no objeto.</param>
        Task UploadAsync(string key, byte[] content, string contentType);

        /// <summary>
        /// Remove um objeto do bucket. Não falha se o objeto não existir.
        /// </summary>
        /// <param name="key">Caminho do objeto dentro do bucket.</param>
        Task DeleteAsync(string key);

        /// <summary>
        /// Monta a URL pública de um objeto do bucket.
        /// </summary>
        /// <param name="key">Caminho do objeto dentro do bucket.</param>
        /// <returns>URL pública, sem query string.</returns>
        string GetPublicUrl(string key);

        /// <summary>
        /// Extrai a chave do objeto a partir de uma URL pública gerada por <see cref="GetPublicUrl"/>,
        /// ignorando a query string.
        /// </summary>
        /// <param name="publicUrl">URL pública do objeto.</param>
        /// <returns>Chave do objeto dentro do bucket.</returns>
        string GetKeyFromPublicUrl(string publicUrl);
    }
}
