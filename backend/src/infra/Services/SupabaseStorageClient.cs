using domain.Interfaces.Services;
using Microsoft.Extensions.Configuration;

namespace infra.Services
{
    public class SupabaseStorageClient(IConfiguration configuration, HttpClient httpClient) : IStorageClient
    {
        public async Task<string?> FileExistsAsync(string bucketName, string fileName)
        {
            var bucketUrl = configuration["Supabase:BucketUrl"]!;
            var url = $"{bucketUrl}{bucketName}/{fileName}";
            
            HttpResponseMessage? response;
            try
            {
                response = await httpClient.SendAsync(new HttpRequestMessage(HttpMethod.Head, url));
            }
            catch { return null; }

            if (!response.IsSuccessStatusCode) return null;

            return url;
        }
    }
}
