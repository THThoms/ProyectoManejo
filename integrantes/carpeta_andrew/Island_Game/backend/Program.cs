using IslandGame.Backend.Hubs;
using IslandGame.Backend.Services;
using Microsoft.Extensions.FileProviders;
using Microsoft.AspNetCore.StaticFiles;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyHeader()
            .AllowAnyMethod()
            .SetIsOriginAllowed(_ => true)
            .AllowCredentials());
});

builder.Services.AddSignalR();
builder.Services.AddSingleton<IslandState>();

var app = builder.Build();
var frontendDistPath = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, "..", "frontend", "dist"));
var localWwwrootPath = app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot");
var staticRootPath = Directory.Exists(frontendDistPath)
    ? frontendDistPath
    : localWwwrootPath;
var hasStaticRoot = Directory.Exists(staticRootPath);
var contentTypeProvider = new FileExtensionContentTypeProvider();
contentTypeProvider.Mappings[".js"] = "text/javascript";
contentTypeProvider.Mappings[".mjs"] = "text/javascript";
contentTypeProvider.Mappings[".css"] = "text/css";

app.Urls.Add("http://0.0.0.0:5000");

if (hasStaticRoot)
{
    var frontendProvider = new PhysicalFileProvider(staticRootPath);

    app.UseDefaultFiles(new DefaultFilesOptions
    {
        FileProvider = frontendProvider
    });
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = frontendProvider,
        ContentTypeProvider = contentTypeProvider
    });
}
else
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

app.UseCors();

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    serverTime = DateTimeOffset.UtcNow
}));

app.MapHub<IslaHub>("/hub/isla");

app.MapGet("/{**path}", async context =>
{
    if (Path.HasExtension(context.Request.Path.Value))
    {
        var relativePath = context.Request.Path.Value?.TrimStart('/').Replace('/', Path.DirectorySeparatorChar) ?? string.Empty;
        var filePath = Path.Combine(staticRootPath, relativePath);

        if (hasStaticRoot && File.Exists(filePath))
        {
            if (!contentTypeProvider.TryGetContentType(filePath, out var contentType))
            {
                contentType = "application/octet-stream";
            }

            context.Response.ContentType = contentType;
            await context.Response.SendFileAsync(filePath);
            return;
        }

        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }

    if (hasStaticRoot)
    {
        context.Response.ContentType = "text/html; charset=utf-8";
        await context.Response.SendFileAsync(Path.Combine(staticRootPath, "index.html"));
        return;
    }

    context.Response.Redirect("/");
});

app.Run();
