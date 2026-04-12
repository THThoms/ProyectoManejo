namespace IslandGame.Backend.Models;

public class Usuario
{
    public required string Id { get; init; }
    public required string Nombre { get; init; }
    public required string ConexionId { get; set; }
    public float PosX { get; set; }
    public float PosY { get; set; }
}
