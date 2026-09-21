namespace domain.Interfaces.Services
{
    public interface IStorageClient
    {
        Task<string?> FileExistsAsync(string bucketName, string fileName);
    }
}
