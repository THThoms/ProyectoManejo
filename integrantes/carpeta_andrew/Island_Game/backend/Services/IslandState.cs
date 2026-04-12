using System.Collections.Concurrent;
using IslandGame.Backend.Models;

namespace IslandGame.Backend.Services;

public class IslandState
{
    private readonly ConcurrentDictionary<string, Usuario> _usuariosPorConexion = new();
    private readonly ConcurrentDictionary<string, Usuario> _usuariosPorId = new();
    private readonly ConcurrentDictionary<string, FriendRequest> _solicitudes = new();
    private readonly ConcurrentDictionary<string, HashSet<string>> _amistades = new();

    public IReadOnlyCollection<Usuario> ObtenerUsuarios()
        => _usuariosPorConexion.Values
            .OrderBy(usuario => usuario.Nombre, StringComparer.OrdinalIgnoreCase)
            .ToArray();

    public Usuario? ObtenerPorId(string userId)
        => _usuariosPorId.TryGetValue(userId, out var usuario) ? usuario : null;

    public Usuario RegistrarUsuario(string connectionId, string nombre)
    {
        var usuario = new Usuario
        {
            Id = Guid.NewGuid().ToString("N"),
            Nombre = nombre,
            ConexionId = connectionId,
            PosX = 400,
            PosY = 240
        };

        _usuariosPorConexion[connectionId] = usuario;
        _usuariosPorId[usuario.Id] = usuario;
        return usuario;
    }

    public Usuario? ObtenerPorConexion(string connectionId)
        => _usuariosPorConexion.TryGetValue(connectionId, out var usuario) ? usuario : null;

    public Usuario? ActualizarPosicion(string connectionId, float x, float y)
    {
        if (!_usuariosPorConexion.TryGetValue(connectionId, out var usuario))
        {
            return null;
        }

        usuario.PosX = x;
        usuario.PosY = y;
        return usuario;
    }

    public Usuario? RemoverUsuario(string connectionId)
    {
        if (!_usuariosPorConexion.TryRemove(connectionId, out var usuario))
        {
            return null;
        }

        _usuariosPorId.TryRemove(usuario.Id, out _);
        return usuario;
    }

    public FriendRequest? CrearSolicitud(string fromConnectionId, string toUserId)
    {
        var fromUser = ObtenerPorConexion(fromConnectionId);
        var toUser = ObtenerPorId(toUserId);

        if (fromUser is null || toUser is null || fromUser.Id == toUser.Id || SonAmigos(fromUser.Id, toUser.Id))
        {
            return null;
        }

        var existente = _solicitudes.Values.FirstOrDefault(request =>
            request.FromUserId == fromUser.Id && request.ToUserId == toUser.Id);

        if (existente is not null)
        {
            return existente;
        }

        var inversa = _solicitudes.Values.FirstOrDefault(request =>
            request.FromUserId == toUser.Id && request.ToUserId == fromUser.Id);

        if (inversa is not null)
        {
            return null;
        }

        var solicitud = new FriendRequest
        {
            Id = Guid.NewGuid().ToString("N"),
            FromUserId = fromUser.Id,
            FromUserName = fromUser.Nombre,
            ToUserId = toUser.Id,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        _solicitudes[solicitud.Id] = solicitud;
        return solicitud;
    }

    public IReadOnlyCollection<FriendRequest> ObtenerSolicitudesParaUsuario(string userId)
        => _solicitudes.Values
            .Where(request => request.ToUserId == userId)
            .OrderByDescending(request => request.CreatedAtUtc)
            .ToArray();

    public bool SonAmigos(string userId1, string userId2)
    {
        return _amistades.TryGetValue(userId1, out var amigos)
            && amigos.Contains(userId2);
    }

    public bool AceptarSolicitud(string requestId, string targetConnectionId, out FriendRequest? solicitudAceptada)
    {
        solicitudAceptada = null;
        var targetUser = ObtenerPorConexion(targetConnectionId);

        if (targetUser is null || !_solicitudes.TryRemove(requestId, out var solicitud) || solicitud.ToUserId != targetUser.Id)
        {
            return false;
        }

        var amigosDelSolicitante = _amistades.GetOrAdd(solicitud.FromUserId, _ => []);
        var amigosDelReceptor = _amistades.GetOrAdd(solicitud.ToUserId, _ => []);

        lock (amigosDelSolicitante)
        {
            amigosDelSolicitante.Add(solicitud.ToUserId);
        }

        lock (amigosDelReceptor)
        {
            amigosDelReceptor.Add(solicitud.FromUserId);
        }

        solicitudAceptada = solicitud;
        return true;
    }

    public IReadOnlyCollection<FriendSummary> ObtenerAmigos(string userId)
    {
        if (!_amistades.TryGetValue(userId, out var amigoIds))
        {
            return [];
        }

        return amigoIds
            .Select(id =>
            {
                var usuario = ObtenerPorId(id);
                return usuario is null
                    ? null
                    : new FriendSummary
                    {
                        UserId = usuario.Id,
                        Nombre = usuario.Nombre,
                        IsOnline = true
                    };
            })
            .Where(item => item is not null)
            .Cast<FriendSummary>()
            .OrderBy(friend => friend.Nombre, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }
}
