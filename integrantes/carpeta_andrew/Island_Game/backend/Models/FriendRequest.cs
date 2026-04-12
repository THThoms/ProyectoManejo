namespace IslandGame.Backend.Models;

public class FriendRequest
{
    public required string Id { get; init; }
    public required string FromUserId { get; init; }
    public required string FromUserName { get; init; }
    public required string ToUserId { get; init; }
    public DateTimeOffset CreatedAtUtc { get; init; }
}
