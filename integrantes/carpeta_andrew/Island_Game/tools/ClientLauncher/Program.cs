using System.Diagnostics;

Console.Title = "Island Game Client";
Console.WriteLine("Island Game Client");
Console.WriteLine("");
Console.Write("Ingresa la IP del host o presiona Enter para localhost: ");

var host = Console.ReadLine();
if (string.IsNullOrWhiteSpace(host))
{
    host = "localhost";
}

var url = $"http://{host.Trim()}:5000";

Console.WriteLine("");
Console.WriteLine($"Abriendo {url}");

Process.Start(new ProcessStartInfo
{
    FileName = url,
    UseShellExecute = true
});

Console.WriteLine("");
Console.WriteLine("Presiona Enter para salir...");
Console.ReadLine();
