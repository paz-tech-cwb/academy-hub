using System.Text.Json.Serialization;
using api.Extensions;
using infra.Config;
using application.Config;
using api.Middlewares;
using Microsoft.AspNetCore.HttpOverrides;
using FluentValidation;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor |
        ForwardedHeaders.XForwardedProto;
});

builder.AddOpenTelemetryExtension();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJs",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

builder.Services.AddInfrastructure();
builder.Services.AddApplication();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

builder.Services.AddJwt(builder.Configuration);
builder.Services.AddScalar();

builder.Services.Configure<Microsoft.AspNetCore.Mvc.JsonOptions>(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});

builder.Services.AddHealthChecks();

var app = builder.Build();

app.UseCors("AllowNextJs");
app.UseForwardedHeaders();
app.UseHttpsRedirection();

// Handle CORS preflight requests before authentication
app.Use(async (context, next) =>
{
    if (context.Request.Method == "OPTIONS")
    {
        context.Response.StatusCode = 200;
        await context.Response.CompleteAsync();
        return;
    }
    await next();
});

app.UseMiddleware<ApiMiddleware>();

app.UseScalar();
app.UseJwt();

app.MapHealthChecks("/api/health");

await app.RunAsync();
