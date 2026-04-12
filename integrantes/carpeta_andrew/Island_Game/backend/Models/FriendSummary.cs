namespace IslandGame.Backend.Models;

public class FriendSummary
{
    public required string UserId { get; init; }
    public required string Nombre { get; init; }
    public bool IsOnline { get; init; }
}
