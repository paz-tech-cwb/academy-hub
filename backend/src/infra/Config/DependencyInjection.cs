using domain.Interfaces.Services;
using domain.Interfaces.Repositories;
using infra.Repositories;
using infra.Services;
using Microsoft.Extensions.DependencyInjection;

namespace infra.Config
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services)
        {
            services.AddScoped<AppDbContext>();
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
        }

        private static void AddServices(IServiceCollection services)
        {
            services.AddHttpClient<IStorageClient, SupabaseStorageClient>();
            services.AddScoped<ILessonService, LessonService>();
            services.AddScoped<IAlternativeService, AlternativeService>();
            services.AddScoped<IAnswerService, AnswerService>();
            services.AddScoped<IQuestionService, QuestionService>();
            services.AddScoped<IJwtService, JwtService>();
            services.AddTransient<IPlaylistService, PlaylistService>();
        }
    }
}
