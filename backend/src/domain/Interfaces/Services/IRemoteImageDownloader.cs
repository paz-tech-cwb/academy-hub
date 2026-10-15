namespace domain.Interfaces.Services
{
    public interface IRemoteImageDownloader
    {
        /// <summary>
        /// Baixa um arquivo de uma URL pública da internet. Endereços internos (loopback,
        /// redes privadas, link-local) são recusados.
        /// </summary>
        /// <param name="url">URL absoluta http ou https.</param>
        /// <param name="maxBytes">Tamanho máximo aceito; o download é interrompido ao ultrapassá-lo.</param>
        /// <returns>O conteúdo baixado, ou <c>null</c> se o download falhar, for recusado ou exceder o limite.</returns>
        Task<byte[]?> DownloadAsync(Uri url, long maxBytes);
    }
}
