import { useEffect, useMemo, useRef, useState } from "react";
import { createIslandGame } from "./game/createIslandGame";
import { createIslandConnection } from "./network/islandConnection";

const initialStatus = {
  phase: "idle",
  text: "Desconectado"
};

export default function App() {
  const gameHostRef = useRef(null);
  const connectionRef = useRef(null);
  const teardownGameRef = useRef(null);
  const playersRef = useRef([]);
  const myUserIdRef = useRef(null);
  const [serverUrl, setServerUrl] = useState(`http://${window.location.hostname || "localhost"}:5000`);
  const [playerName, setPlayerName] = useState("");
  const [myUserId, setMyUserId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedFriendId, setSelectedFriendId] = useState(null);
  const [privateChatInput, setPrivateChatInput] = useState("");
  const [privateMessagesByFriend, setPrivateMessagesByFriend] = useState({});
  const [status, setStatus] = useState(initialStatus);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    return () => {
      teardownGameRef.current?.();
      connectionRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    myUserIdRef.current = myUserId;
  }, [myUserId]);

  useEffect(() => {
    if (!gameHostRef.current) {
      return;
    }

    teardownGameRef.current?.();
    teardownGameRef.current = createIslandGame(gameHostRef.current, {
      getPlayers: () => playersRef.current,
      getMyUserId: () => myUserIdRef.current,
      onMoveRequest: async ({ x, y }) => {
        await connectionRef.current?.move(x, y);
      }
    });

    return () => {
      teardownGameRef.current?.();
      teardownGameRef.current = null;
    };
  }, []);

  const connectedPlayers = useMemo(
    () => players.slice().sort((left, right) => left.nombre.localeCompare(right.nombre)),
    [players]
  );

  const friendIds = useMemo(() => new Set(friends.map((friend) => friend.userId)), [friends]);
  const pendingFromIds = useMemo(() => new Set(pendingRequests.map((request) => request.fromUserId)), [pendingRequests]);
  const selectedFriend = useMemo(
    () => friends.find((friend) => friend.userId === selectedFriendId) ?? null,
    [friends, selectedFriendId]
  );
  const privateMessages = selectedFriendId ? privateMessagesByFriend[selectedFriendId] ?? [] : [];

  async function handleConnect() {
    if (connectionRef.current || isConnecting) {
      return;
    }

    setIsConnecting(true);
    setStatus({ phase: "connecting", text: "Conectando..." });

    try {
      const connection = createIslandConnection({
        serverUrl,
        onStatusChange: (nextStatus) => {
          setStatus(nextStatus);
          setIsConnected(nextStatus.phase === "connected");
        },
        onInitialState: ({ tuUsuarioId, usuarios, solicitudesPendientes, amigos }) => {
          setMyUserId(tuUsuarioId);
          setPlayers(usuarios ?? []);
          setChatMessages([]);
          setPendingRequests(solicitudesPendientes ?? []);
          setFriends(amigos ?? []);
          setSelectedFriendId((amigos ?? [])[0]?.userId ?? null);
          setPrivateMessagesByFriend({});
        },
        onUsersUpdated: setPlayers,
        onUserMoved: (usuario) => {
          setPlayers((current) => {
            const next = [...current];
            const index = next.findIndex((entry) => entry.id === usuario.id);

            if (index >= 0) {
              next[index] = usuario;
            } else {
              next.push(usuario);
            }

            return next;
          });
        },
        onUserDisconnected: (userId) => {
          setPlayers((current) => current.filter((entry) => entry.id !== userId));
        },
        onChatReceived: (message) => {
          setChatMessages((current) => [message, ...current].slice(0, 40));
        },
        onFriendRequestReceived: (request) => {
          setPendingRequests((current) => {
            if (current.some((entry) => entry.id === request.id)) {
              return current;
            }

            return [request, ...current];
          });
        },
        onFriendRequestAccepted: ({ requestId, amigo }) => {
          setPendingRequests((current) => current.filter((entry) => entry.id !== requestId));
          setFriends((current) => {
            if (current.some((entry) => entry.userId === amigo.userId)) {
              return current;
            }

            return [...current, amigo].sort((left, right) => left.nombre.localeCompare(right.nombre));
          });
          setSelectedFriendId((current) => current ?? amigo.userId);
        },
        onFriendsUpdated: (nextFriends) => {
          setFriends(nextFriends ?? []);
          setSelectedFriendId((current) => current ?? (nextFriends ?? [])[0]?.userId ?? null);
        },
        onPrivateChatReceived: (message) => {
          const friendId = message.fromUserId === myUserIdRef.current ? message.toUserId : message.fromUserId;

          setPrivateMessagesByFriend((current) => ({
            ...current,
            [friendId]: [message, ...(current[friendId] ?? [])].slice(0, 40)
          }));

          setSelectedFriendId((current) => current ?? friendId);
        }
      });

      await connection.connect(playerName.trim() || "Jugador");
      connectionRef.current = connection;
    } catch (error) {
      setStatus({ phase: "error", text: "No se pudo conectar" });
      setIsConnected(false);
      console.error(error);
    } finally {
      setIsConnecting(false);
    }
  }

  async function handleSendChat(event) {
    event.preventDefault();

    const mensaje = chatInput.trim();
    if (!mensaje || !connectionRef.current) {
      return;
    }

    try {
      await connectionRef.current.sendGlobalChat(mensaje);
      setChatInput("");
    } catch (error) {
      console.error(error);
    }
  }

  async function handleSendFriendRequest(toUserId) {
    if (!connectionRef.current) {
      return;
    }

    try {
      await connectionRef.current.sendFriendRequest(toUserId);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleAcceptFriendRequest(requestId) {
    if (!connectionRef.current) {
      return;
    }

    try {
      await connectionRef.current.acceptFriendRequest(requestId);
      setPendingRequests((current) => current.filter((entry) => entry.id !== requestId));
    } catch (error) {
      console.error(error);
    }
  }

  async function handleSendPrivateChat(event) {
    event.preventDefault();

    const mensaje = privateChatInput.trim();
    if (!mensaje || !selectedFriendId || !connectionRef.current) {
      return;
    }

    try {
      await connectionRef.current.sendPrivateChat(selectedFriendId, mensaje);
      setPrivateChatInput("");
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <main className="app-shell">
      <section className="game-panel panel">
        <header className="game-toolbar">
          <div>
            <p className="eyebrow">Island Game</p>
            <h1>Isla social en LAN</h1>
            <p className="muted">Haz clic en la isla para moverte y encontrar amigos en tiempo real.</p>
          </div>
          <div className={`status-chip status-${status.phase}`}>{status.text}</div>
        </header>

        <div className="game-stage-wrap">
          <div ref={gameHostRef} className="game-stage" />
        </div>
      </section>

      <aside className="sidebar panel">
        <section className="card stack">
          <div>
            <p className="eyebrow">Conexion</p>
            <h2>Entrar a la isla</h2>
          </div>

          <label className="field-label" htmlFor="serverUrl">
            URL del servidor
          </label>
          <input
            id="serverUrl"
            className="field"
            value={serverUrl}
            onChange={(event) => setServerUrl(event.target.value)}
            placeholder="http://192.168.0.100:5000"
          />

          <label className="field-label" htmlFor="playerName">
            Tu nombre
          </label>
          <input
            id="playerName"
            className="field"
            value={playerName}
            maxLength={20}
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder="Ej. Nico"
          />

          <button className="button" type="button" onClick={handleConnect} disabled={isConnecting || isConnected}>
            {isConnected ? "Conectado" : isConnecting ? "Conectando..." : "Entrar"}
          </button>
        </section>

        <section className="card stack">
          <div className="card-header">
            <div>
              <p className="eyebrow">Jugadores</p>
              <h2>Conectados</h2>
            </div>
            <span className="counter">{connectedPlayers.length}</span>
          </div>

          <ul className="simple-list compact-list">
            {connectedPlayers.map((player) => (
              <li key={player.id}>
                <div className="row-spread">
                  <div className="stack tight">
                    <strong>{player.nombre}</strong>
                    <span>
                      {Math.round(player.posX)}, {Math.round(player.posY)}
                    </span>
                  </div>
                  {player.id !== myUserId && !friendIds.has(player.id) && (
                    <button
                      className="button secondary"
                      type="button"
                      disabled={!isConnected || pendingFromIds.has(player.id)}
                      onClick={() => handleSendFriendRequest(player.id)}
                    >
                      {pendingFromIds.has(player.id) ? "Pendiente" : "Agregar"}
                    </button>
                  )}
                </div>
              </li>
            ))}
            {connectedPlayers.length === 0 && <li className="empty">Todavia no hay jugadores conectados.</li>}
          </ul>
        </section>

        <section className="card stack">
          <div className="card-header">
            <div>
              <p className="eyebrow">Amistad</p>
              <h2>Solicitudes</h2>
            </div>
            <span className="counter">{pendingRequests.length}</span>
          </div>

          <ul className="simple-list compact-list">
            {pendingRequests.map((request) => (
              <li key={request.id}>
                <div className="row-spread">
                  <div className="stack tight">
                    <strong>{request.fromUserName}</strong>
                    <span>Quiere ser tu amigo</span>
                  </div>
                  <button className="button secondary" type="button" onClick={() => handleAcceptFriendRequest(request.id)}>
                    Aceptar
                  </button>
                </div>
              </li>
            ))}
            {pendingRequests.length === 0 && <li className="empty">No tienes solicitudes pendientes.</li>}
          </ul>
        </section>

        <section className="card stack grow">
          <div className="card-header">
            <div>
              <p className="eyebrow">Amigos</p>
              <h2>Chat privado</h2>
            </div>
            <span className="counter">{friends.length}</span>
          </div>

          <div className="friend-grid">
            <ul className="simple-list compact-list">
              {friends.map((friend) => (
                <li key={friend.userId}>
                  <button
                    className={`friend-button ${selectedFriendId === friend.userId ? "active" : ""}`.trim()}
                    type="button"
                    onClick={() => setSelectedFriendId(friend.userId)}
                  >
                    <strong>{friend.nombre}</strong>
                    <span>{friend.isOnline ? "En linea" : "Desconectado"}</span>
                  </button>
                </li>
              ))}
              {friends.length === 0 && <li className="empty">Acepta amistades para habilitar el chat privado.</li>}
            </ul>

            <div className="private-chat-panel">
              <div className="private-chat-header">
                <strong>{selectedFriend?.nombre ?? "Sin amigo seleccionado"}</strong>
                <span>{selectedFriend?.isOnline ? "Privado activo" : "Privado inactivo"}</span>
              </div>

              <form className="chat-form" onSubmit={handleSendPrivateChat}>
                <input
                  className="field"
                  value={privateChatInput}
                  maxLength={160}
                  onChange={(event) => setPrivateChatInput(event.target.value)}
                  placeholder="Escribe un mensaje privado"
                />
                <button className="button" type="submit" disabled={!selectedFriendId || !isConnected}>
                  Enviar
                </button>
              </form>

              <ul className="chat-list">
                {privateMessages.map((message, index) => (
                  <li key={`${message.fromUserId}-${message.fechaUtc}-${index}`}>
                    <div className="chat-meta">
                      <strong>{message.fromNombre}</strong>
                      <span>{new Date(message.fechaUtc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p>{message.mensaje}</p>
                  </li>
                ))}
                {privateMessages.length === 0 && <li className="empty">Los mensajes privados apareceran aqui.</li>}
              </ul>
            </div>
          </div>
        </section>

        <section className="card stack grow">
          <div>
            <p className="eyebrow">Chat</p>
            <h2>Global</h2>
          </div>

          <form className="chat-form" onSubmit={handleSendChat}>
            <input
              className="field"
              value={chatInput}
              maxLength={160}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Escribe un mensaje"
            />
            <button className="button" type="submit" disabled={!isConnected}>
              Enviar
            </button>
          </form>

          <ul className="chat-list">
            {chatMessages.map((message, index) => (
              <li key={`${message.usuarioId}-${message.fechaUtc}-${index}`}>
                <div className="chat-meta">
                  <strong>{message.nombre}</strong>
                  <span>{new Date(message.fechaUtc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p>{message.mensaje}</p>
              </li>
            ))}
            {chatMessages.length === 0 && <li className="empty">Cuando envies mensajes apareceran aqui.</li>}
          </ul>
        </section>
      </aside>
    </main>
  );
}
