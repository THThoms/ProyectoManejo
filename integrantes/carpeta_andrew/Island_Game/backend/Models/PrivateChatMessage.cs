namespace IslandGame.Backend.Models;

public class PrivateChatMessage
{
    public required string FromUserId { get; init; }
    public required string FromNombre { get; init; }
    public required string ToUserId { get; init; }
    public required string Mensaje { get; init; }
    public DateTimeOffset FechaUtc { get; init; }
}
