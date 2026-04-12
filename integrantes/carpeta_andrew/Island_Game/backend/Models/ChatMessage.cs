namespace IslandGame.Backend.Models;

public class ChatMessage
{
    public required string UsuarioId { get; init; }
    public required string Nombre { get; init; }
    public required string Mensaje { get; init; }
    public DateTimeOffset FechaUtc { get; init; }
}
