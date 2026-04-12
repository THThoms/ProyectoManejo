import * as signalR from "@microsoft/signalr";

export function createIslandConnection({
  serverUrl,
  onStatusChange,
  onInitialState,
  onUsersUpdated,
  onUserMoved,
  onUserDisconnected,
  onChatReceived,
  onFriendRequestReceived,
  onFriendRequestAccepted,
  onFriendsUpdated,
  onPrivateChatReceived
}) {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(`${serverUrl.replace(/\/$/, "")}/hub/isla`)
    .withAutomaticReconnect()
    .build();

  connection.onreconnecting(() => {
    onStatusChange({ phase: "connecting", text: "Reconectando..." });
  });

  connection.onreconnected(() => {
    onStatusChange({ phase: "connected", text: "Conectado" });
  });

  connection.onclose(() => {
    onStatusChange({ phase: "idle", text: "Desconectado" });
  });

  connection.on("EstadoInicial", onInitialState);
  connection.on("ActualizarUsuarios", onUsersUpdated);
  connection.on("ActualizarPosicion", onUserMoved);
  connection.on("UsuarioDesconectado", onUserDisconnected);
  connection.on("RecibirChatGlobal", onChatReceived);
  connection.on("SolicitudAmistadRecibida", onFriendRequestReceived);
  connection.on("SolicitudAmistadAceptada", onFriendRequestAccepted);
  connection.on("ActualizarAmigos", onFriendsUpdated);
  connection.on("RecibirChatPrivado", onPrivateChatReceived);

  return {
    async connect(nombre) {
      await connection.start();
      onStatusChange({ phase: "connected", text: "Conectado" });
      await connection.invoke("Conectar", nombre);
    },

    async move(x, y) {
      await connection.invoke("Mover", x, y);
    },

    async sendGlobalChat(mensaje) {
      await connection.invoke("EnviarChatGlobal", mensaje);
    },

    async sendFriendRequest(toUserId) {
      await connection.invoke("EnviarSolicitudAmistad", toUserId);
    },

    async acceptFriendRequest(requestId) {
      await connection.invoke("AceptarSolicitudAmistad", requestId);
    },

    async sendPrivateChat(toUserId, mensaje) {
      await connection.invoke("EnviarChatPrivado", toUserId, mensaje);
    },

    async dispose() {
      if (connection.state !== signalR.HubConnectionState.Disconnected) {
        await connection.stop();
      }
    }
  };
}
