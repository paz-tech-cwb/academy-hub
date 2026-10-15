using System.Net;
using System.Net.Sockets;
using domain.Interfaces.Services;

namespace infra.Services
{
    /// <summary>
    /// Baixa imagens de URLs informadas pelo usuário. O <see cref="HttpClient"/> injetado deve usar o
    /// handler de <see cref="CreateHandler"/>, que impede conexões com endereços internos (SSRF).
    /// </summary>
    public class RemoteImageDownloader(HttpClient httpClient) : IRemoteImageDownloader
    {
        private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(15);

        /// <summary>
        /// Baixa um arquivo de uma URL pública da internet, interrompendo o download se ele passar do limite.
        /// </summary>
        /// <param name="url">URL absoluta http ou https.</param>
        /// <param name="maxBytes">Tamanho máximo aceito.</param>
        /// <returns>O conteúdo baixado, ou <c>null</c> se o download falhar, for recusado ou exceder o limite.</returns>
        public async Task<byte[]?> DownloadAsync(Uri url, long maxBytes)
        {
            if (!url.IsAbsoluteUri || (url.Scheme != Uri.UriSchemeHttp && url.Scheme != Uri.UriSchemeHttps))
                return null;

            using var cts = new CancellationTokenSource(Timeout);
            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.UserAgent.ParseAdd("Mozilla/5.0 (compatible; AcademyHub/1.0)");
                request.Headers.Accept.ParseAdd("image/*");

                using var response = await httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cts.Token);
                if (!response.IsSuccessStatusCode) return null;
                if (response.Content.Headers.ContentLength > maxBytes) return null;

                await using var stream = await response.Content.ReadAsStreamAsync(cts.Token);
                using var buffer = new MemoryStream();
                var chunk = new byte[81920];
                int read;
                while ((read = await stream.ReadAsync(chunk, cts.Token)) > 0)
                {
                    if (buffer.Length + read > maxBytes) return null;
                    buffer.Write(chunk, 0, read);
                }

                return buffer.ToArray();
            }
            catch (Exception ex) when (ex is HttpRequestException or OperationCanceledException or IOException)
            {
                return null;
            }
        }

        /// <summary>
        /// Cria o handler HTTP usado pelo downloader: segue até 3 redirecionamentos e só conecta em
        /// endereços públicos. A checagem acontece no momento da conexão, então vale também para
        /// redirecionamentos e para DNS que muda de resposta entre a validação e o uso.
        /// </summary>
        /// <returns>Handler configurado.</returns>
        public static SocketsHttpHandler CreateHandler() => new()
        {
            AllowAutoRedirect = true,
            MaxAutomaticRedirections = 3,
            AutomaticDecompression = DecompressionMethods.All,
            UseProxy = false,
            ConnectCallback = async (context, cancellationToken) =>
            {
                var addresses = await Dns.GetHostAddressesAsync(context.DnsEndPoint.Host, cancellationToken);
                var address = addresses.FirstOrDefault(IsPublicAddress)
                    ?? throw new HttpRequestException($"O host {context.DnsEndPoint.Host} não resolve para um endereço público.");

                var socket = new Socket(address.AddressFamily, SocketType.Stream, ProtocolType.Tcp) { NoDelay = true };
                try
                {
                    await socket.ConnectAsync(new IPEndPoint(address, context.DnsEndPoint.Port), cancellationToken);
                    return new NetworkStream(socket, ownsSocket: true);
                }
                catch
                {
                    socket.Dispose();
                    throw;
                }
            }
        };

        /// <summary>
        /// Indica se o endereço é roteável publicamente, recusando loopback, redes privadas, link-local,
        /// CGNAT, multicast e faixas reservadas.
        /// </summary>
        /// <param name="address">Endereço resolvido.</param>
        /// <returns><c>true</c> se o endereço for público.</returns>
        private static bool IsPublicAddress(IPAddress address)
        {
            if (address.IsIPv4MappedToIPv6) address = address.MapToIPv4();
            if (IPAddress.IsLoopback(address)) return false;

            if (address.AddressFamily == AddressFamily.InterNetwork)
            {
                var b = address.GetAddressBytes();
                return !(b[0] == 0
                    || b[0] == 10
                    || (b[0] == 100 && b[1] >= 64 && b[1] <= 127)
                    || (b[0] == 169 && b[1] == 254)
                    || (b[0] == 172 && b[1] >= 16 && b[1] <= 31)
                    || (b[0] == 192 && b[1] == 168)
                    || b[0] >= 224);
            }

            if (address.AddressFamily == AddressFamily.InterNetworkV6)
            {
                var b = address.GetAddressBytes();
                return !(address.Equals(IPAddress.IPv6None)
                    || address.IsIPv6LinkLocal
                    || address.IsIPv6SiteLocal
                    || address.IsIPv6Multicast
                    || (b[0] & 0xFE) == 0xFC);
            }

            return false;
        }
    }
}
