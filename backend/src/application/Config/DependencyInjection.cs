using application.UseCases;
using Microsoft.Extensions.DependencyInjection;

namespace application.Config
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            AddUseCases(services);
            return services;
        }

        private static void AddUseCases(IServiceCollection services)
        {
            // usecases
            services.AddScoped<GetLessonsUseCase>();
            services.AddScoped<GetLessonUseCase>();
            services.AddScoped<IssueCertificateUseCase>();
            services.AddScoped<LoginUseCase>();
            services.AddScoped<RegisterUseCase>();
            services.AddScoped<VerifyAnswersUseCase>();
            services.AddScoped<GetUnitiesUseCase>();
            services.AddScoped<GetUnityUseCase>();
            services.AddScoped<GetQuestionnaireUseCase>();
            services.AddScoped<ImportPlaylistUseCase>();
            services.AddScoped<CreateUnityUseCase>();
            services.AddScoped<DeleteUnityUseCase>();
            services.AddScoped<CreateLessonUseCase>();
            services.AddScoped<DeleteLessonUseCase>();
            services.AddScoped<CreateQuestionUseCase>();
            services.AddScoped<DeleteQuestionUseCase>();
            services.AddScoped<CreateAlternativeUseCase>();
            services.AddScoped<UpdateAlternativeUseCase>();
            services.AddScoped<DeleteAlternativeUseCase>();
        }
    }
}
