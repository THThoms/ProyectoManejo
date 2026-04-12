using IslandGame.Backend.Models;
using IslandGame.Backend.Services;
using Microsoft.AspNetCore.SignalR;

namespace IslandGame.Backend.Hubs;

public class IslaHub(IslandState islandState) : Hub
{
    private readonly IslandState _islandState = islandState;

    public async Task Conectar(string nombre)
    {
        var nombreNormalizado = string.IsNullOrWhiteSpace(nombre)
            ? "Jugador"
            : nombre.Trim();

        var usuario = _islandState.RegistrarUsuario(Context.ConnectionId, nombreNormalizado);

        await Clients.Caller.SendAsync("EstadoInicial", new
        {
            tuUsuarioId = usuario.Id,
            usuarios = _islandState.ObtenerUsuarios(),
            solicitudesPendientes = _islandState.ObtenerSolicitudesParaUsuario(usuario.Id),
            amigos = _islandState.ObtenerAmigos(usuario.Id)
        });

        await Clients.Others.SendAsync("UsuarioConectado", usuario);
        await Clients.All.SendAsync("ActualizarUsuarios", _islandState.ObtenerUsuarios());
        await NotificarAmigosDelUsuario(usuario.Id);
    }

    public async Task Mover(float x, float y)
    {
        var usuario = _islandState.ActualizarPosicion(Context.ConnectionId, x, y);
        if (usuario is null)
        {
            return;
        }

        await Clients.All.SendAsync("ActualizarPosicion", usuario);
    }

    public async Task EnviarChatGlobal(string mensaje)
    {
        var usuario = _islandState.ObtenerPorConexion(Context.ConnectionId);
        if (usuario is null || string.IsNullOrWhiteSpace(mensaje))
        {
            return;
        }

        var chatMessage = new ChatMessage
        {
            UsuarioId = usuario.Id,
            Nombre = usuario.Nombre,
            Mensaje = mensaje.Trim(),
            FechaUtc = DateTimeOffset.UtcNow
        };

        await Clients.All.SendAsync("RecibirChatGlobal", chatMessage);
    }

    public async Task EnviarSolicitudAmistad(string toUserId)
    {
        var solicitud = _islandState.CrearSolicitud(Context.ConnectionId, toUserId);
        if (solicitud is null)
        {
            return;
        }

        var destino = _islandState.ObtenerPorId(toUserId);
        if (destino is not null)
        {
            await Clients.Client(destino.ConexionId).SendAsync("SolicitudAmistadRecibida", solicitud);
        }
    }

    public async Task AceptarSolicitudAmistad(string requestId)
    {
        if (!_islandState.AceptarSolicitud(requestId, Context.ConnectionId, out var solicitud) || solicitud is null)
        {
            return;
        }

        var user1 = _islandState.ObtenerPorId(solicitud.FromUserId);
        var user2 = _islandState.ObtenerPorId(solicitud.ToUserId);

        if (user1 is null || user2 is null)
        {
            return;
        }

        await Clients.Client(user2.ConexionId).SendAsync("SolicitudAmistadAceptada", new
        {
            requestId,
            amigo = new FriendSummary
            {
                UserId = user1.Id,
                Nombre = user1.Nombre,
                IsOnline = true
            }
        });

        await Clients.Client(user1.ConexionId).SendAsync("SolicitudAmistadAceptada", new
        {
            requestId,
            amigo = new FriendSummary
            {
                UserId = user2.Id,
                Nombre = user2.Nombre,
                IsOnline = true
            }
        });
    }

    public async Task EnviarChatPrivado(string toUserId, string mensaje)
    {
        var fromUser = _islandState.ObtenerPorConexion(Context.ConnectionId);
        var toUser = _islandState.ObtenerPorId(toUserId);

        if (fromUser is null || toUser is null || string.IsNullOrWhiteSpace(mensaje) || !_islandState.SonAmigos(fromUser.Id, toUser.Id))
        {
            return;
        }

        var chat = new PrivateChatMessage
        {
            FromUserId = fromUser.Id,
            FromNombre = fromUser.Nombre,
            ToUserId = toUser.Id,
            Mensaje = mensaje.Trim(),
            FechaUtc = DateTimeOffset.UtcNow
        };

        await Clients.Client(fromUser.ConexionId).SendAsync("RecibirChatPrivado", chat);
        await Clients.Client(toUser.ConexionId).SendAsync("RecibirChatPrivado", chat);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var usuario = _islandState.RemoverUsuario(Context.ConnectionId);
        if (usuario is not null)
        {
            await Clients.All.SendAsync("UsuarioDesconectado", usuario.Id);
            await Clients.All.SendAsync("ActualizarUsuarios", _islandState.ObtenerUsuarios());
            await NotificarAmigosDelUsuario(usuario.Id);
        }

        await base.OnDisconnectedAsync(exception);
    }

    private async Task NotificarAmigosDelUsuario(string userId)
    {
        var usuario = _islandState.ObtenerPorId(userId);
        var amigos = _islandState.ObtenerAmigos(userId);

        foreach (var amigo in amigos)
        {
            var usuarioAmigo = _islandState.ObtenerPorId(amigo.UserId);
            if (usuarioAmigo is null)
            {
                continue;
            }

            await Clients.Client(usuarioAmigo.ConexionId).SendAsync(
                "ActualizarAmigos",
                _islandState.ObtenerAmigos(amigo.UserId));
        }

        if (usuario is not null)
        {
            await Clients.Client(usuario.ConexionId).SendAsync("ActualizarAmigos", amigos);
        }
    }
}
