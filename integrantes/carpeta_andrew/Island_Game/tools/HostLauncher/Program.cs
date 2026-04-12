using System.Diagnostics;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;

var rootPath = AppContext.BaseDirectory;
var serverExePath = Path.Combine(rootPath, "server", "IslandGame.Backend.exe");
const string gameUrl = "http://localhost:5000";

Console.Title = "Island Game Host";
Console.WriteLine("Island Game Host");
Console.WriteLine("");

if (!File.Exists(serverExePath))
{
    Console.WriteLine("No se encontro el servidor publicado.");
    Console.WriteLine($"Ruta esperada: {serverExePath}");
    Console.WriteLine("");
    Console.WriteLine("Ejecuta antes el empaquetado del juego.");
    PauseAndExit(1);
}

if (await IsServerRunningAsync())
{
    Console.WriteLine("Ya hay un servidor ejecutandose en http://localhost:5000");
}
else if (await IsPortOpenAsync())
{
    Console.WriteLine("El puerto 5000 ya esta ocupado por otra aplicacion.");
    Console.WriteLine("Cierra esa aplicacion o cambia el puerto antes de usar Island Game Host.");
    PauseAndExit(1);
}
else
{
    Console.WriteLine("Iniciando servidor local...");

    Process.Start(new ProcessStartInfo
    {
        FileName = serverExePath,
        WorkingDirectory = Path.GetDirectoryName(serverExePath)!,
        UseShellExecute = true
    });

    await WaitForServerAsync();
}

Console.WriteLine("");
Console.WriteLine("Comparte una de estas URLs con los clientes:");

foreach (var ip in GetLocalIpv4Addresses())
{
    Console.WriteLine($"  http://{ip}:5000");
}

Console.WriteLine("");
Console.WriteLine("Abriendo juego en este equipo...");
OpenBrowser(gameUrl);
Console.WriteLine("Presiona Enter para salir...");
Console.ReadLine();

static async Task<bool> IsServerRunningAsync()
{
    try
    {
        using var client = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(1.5)
        };

        using var response = await client.GetAsync("http://localhost:5000/health");
        return response.IsSuccessStatusCode;
    }
    catch
    {
        return false;
    }
}

static async Task WaitForServerAsync()
{
    for (var attempt = 0; attempt < 30; attempt++)
    {
        if (await IsServerRunningAsync())
        {
            return;
        }

        await Task.Delay(1000);
    }

    Console.WriteLine("El servidor no respondio a tiempo.");
    PauseAndExit(1);
}

static async Task<bool> IsPortOpenAsync()
{
    try
    {
        using var client = new TcpClient();
        var connectTask = client.ConnectAsync(IPAddress.Loopback, 5000);
        var completedTask = await Task.WhenAny(connectTask, Task.Delay(1200));
        return completedTask == connectTask && client.Connected;
    }
    catch
    {
        return false;
    }
}

static IReadOnlyList<string> GetLocalIpv4Addresses()
{
    return NetworkInterface.GetAllNetworkInterfaces()
        .Where(item =>
            item.OperationalStatus == OperationalStatus.Up &&
            item.NetworkInterfaceType != NetworkInterfaceType.Loopback)
        .SelectMany(item => item.GetIPProperties().UnicastAddresses)
        .Where(item => item.Address.AddressFamily == AddressFamily.InterNetwork && !IPAddress.IsLoopback(item.Address))
        .Select(item => item.Address.ToString())
        .Distinct()
        .OrderBy(item => item)
        .ToArray();
}

static void OpenBrowser(string url)
{
    Process.Start(new ProcessStartInfo
    {
        FileName = url,
        UseShellExecute = true
    });
}

static void PauseAndExit(int exitCode)
{
    Console.WriteLine("");
    Console.WriteLine("Presiona Enter para salir...");
    Console.ReadLine();
    Environment.Exit(exitCode);
}
