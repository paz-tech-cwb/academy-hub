using application.Services;
using application.UseCases;
using Microsoft.Extensions.DependencyInjection;

namespace application.Config
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            AddUseCases(services);
            AddServices(services);
            return services;
        }

        private static void AddUseCases(IServiceCollection services)
        {
            // usecases
            services.AddScoped<GetLessonsUseCase>();
            services.AddScoped<GetLessonUseCase>();
            services.AddScoped<IssueCertificateUseCase>();
            services.AddScoped<VerifyAnswersUseCase>();
            services.AddScoped<GetUnitiesUseCase>();
            services.AddScoped<GetUnityUseCase>();
            services.AddScoped<GetQuestionnaireUseCase>();
            services.AddScoped<GetMyProgressUseCase>();
            services.AddScoped<ImportPlaylistUseCase>();
            services.AddScoped<CreateUnityUseCase>();
            services.AddScoped<DeleteUnityUseCase>();
            services.AddScoped<UploadUnityCoverUseCase>();
            services.AddScoped<SetUnityCoverFromUrlUseCase>();
            services.AddScoped<RemoveUnityCoverUseCase>();
            services.AddScoped<CreateLessonUseCase>();
            services.AddScoped<DeleteLessonUseCase>();
            services.AddScoped<ReorderLessonsUseCase>();
            services.AddScoped<CreateQuestionUseCase>();
            services.AddScoped<DeleteQuestionUseCase>();
            services.AddScoped<CreateAlternativeUseCase>();
            services.AddScoped<UpdateAlternativeUseCase>();
            services.AddScoped<DeleteAlternativeUseCase>();
        }

        private static void AddServices(IServiceCollection services)
        {
            services.AddScoped<RoleService>();
            services.AddScoped<CapabilityService>();
            services.AddScoped<UnityCoverService>();
            services.AddScoped<ProfilePicService>();
            services.AddScoped<UserService>();
        }
    }
}
