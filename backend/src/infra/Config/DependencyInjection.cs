using domain.Interfaces.Services;
using domain.Interfaces.Repositories;
using infra.Repositories;
using infra.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace infra.Config
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services)
        {
            services.AddScoped<AppDbContext>();
            services.AddMemoryCache();
            AddRepositories(services);
            AddServices(services);
            
            return services;
        }

        private static void AddRepositories(IServiceCollection services)
        {
            services.AddScoped(typeof(IBaseRepository<>), typeof(BaseRepository<>));
            services.AddScoped<IAnswerRepository, AnswerRepository>();
            services.AddScoped<ICertificateRepository, CertificateRepository>();
            services.AddScoped<ILessonRepository, LessonRepository>();
            services.AddScoped<IQuestionRepository, QuestionRepository>();
            services.AddScoped<IUnityRepository, UnityRepository>();
            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<IAlternativeRepository, AlternativeRepository>();
            services.AddScoped<IRoleRepository, RoleRepository>();
            services.AddScoped<ICapabilityRepository, CapabilityRepository>();
        }

        private static void AddServices(IServiceCollection services)
        {
            services.AddSingleton<IStorageClient>(provider =>
            {
                var configuration = provider.GetRequiredService<IConfiguration>();
                return new R2StorageClient(new R2Settings(
                    AccountId: configuration["R2:AccountId"] ?? string.Empty,
                    AccessKeyId: GetEnvironmentVariable("R2_ACCESS_KEY_ID"),
                    SecretAccessKey: GetEnvironmentVariable("R2_SECRET_ACCESS_KEY"),
                    BucketName: configuration["R2:BucketName"] ?? string.Empty,
                    PublicUrl: configuration["R2:PublicUrl"] ?? string.Empty));
            });
            services.AddSingleton<IImageProcessor, SkiaImageProcessor>();
            services.AddHttpClient<IRemoteImageDownloader, RemoteImageDownloader>()
                .ConfigurePrimaryHttpMessageHandler(RemoteImageDownloader.CreateHandler);
            services.AddScoped<ILessonService, LessonService>();
            services.AddScoped<IAlternativeService, AlternativeService>();
            services.AddScoped<IAnswerService, AnswerService>();
            services.AddScoped<IQuestionService, QuestionService>();
            services.AddScoped<IJwtService, JwtService>();
            services.AddTransient<IPlaylistService, PlaylistService>();
            services.AddSingleton<ICapabilityResolver, CapabilityResolver>();
        }

        /// <summary>
        /// Lê uma variável de ambiente do processo.
        /// </summary>
        /// <param name="name">Nome da variável.</param>
        /// <returns>O valor da variável, ou string vazia se ela não estiver definida.</returns>
        private static string GetEnvironmentVariable(string name) =>
            Environment.GetEnvironmentVariable(name) ?? string.Empty;
    }
}
