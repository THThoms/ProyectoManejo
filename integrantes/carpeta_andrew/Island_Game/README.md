# Island Game

MVP inicial para una isla social 2D en red local usando ASP.NET Core + SignalR en backend y React + Phaser en frontend.

## Estado actual

Incluye:

- Backend ASP.NET Core listo para LAN
- Hub de SignalR para presencia, movimiento y chat global
- Estado en memoria para usuarios conectados
- Cliente web minimo servido por el backend para prueba rapida
- Frontend separado en `frontend/` con React + Phaser

## Ejecutar backend

Desde `C:\Users\HOME\Desktop\Island_Game\backend`:

```powershell
dotnet run
```

El servidor queda escuchando en:

```text
http://0.0.0.0:5000
```

En la maquina host, abre el navegador con:

```text
http://localhost:5000
```

En otro dispositivo de la misma red WiFi, abre:

```text
http://IP-LOCAL-DEL-HOST:5000
```

Ejemplo:

```text
http://192.168.1.10:5000
```

## Ejecutar frontend React + Phaser

Desde `C:\Users\HOME\Desktop\Island_Game\frontend`:

```powershell
npm install
npm run dev
```

Abre:

```text
http://localhost:5173
```

Si pruebas desde otro dispositivo en la misma red:

```text
http://192.168.0.100:5173
```

Dentro de la app frontend, en `URL del servidor`, usa:

```text
http://192.168.0.100:5000
```

## Inicio facil para usuarios

En Windows puedes usar:

- `Host-Game.cmd` para el anfitrion. Compila el frontend y levanta un solo servidor en `:5000`.
- `Client-Game.cmd` para los demas jugadores. Pide la IP del host y abre el juego en `:5000`.

Archivos de apoyo:

- `scripts/Start-Backend.ps1`
- `scripts/Start-Frontend.ps1`
- `scripts/Start-Host.ps1`
- `scripts/Open-Client.ps1`

## Modo recomendado para jugar

1. El anfitrion hace doble clic en `Host-Game.cmd`.
2. Espera a que termine la compilacion del frontend.
3. Los clientes hacen doble clic en `Client-Game.cmd`.
4. Escriben la IP local del host, por ejemplo `192.168.0.100`.

Con este modo, todos usan una sola URL:

```text
http://IP-DEL-HOST:5000
```

## Ejecutables Host y Client

Si quieres generar ejecutables separados para repartir:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\Package-Game.ps1
```

Eso genera:

- `dist\Host\IslandGame.HostLauncher.exe`
- `dist\Client\IslandGame.ClientLauncher.exe`

Rol de cada ejecutable:

- `HostLauncher.exe` crea o reutiliza el servidor local, muestra las IPs del host y abre el juego.
- `ClientLauncher.exe` solo pide la IP del host y abre el juego.

El backend y el frontend compilado quedan incluidos dentro de `dist\Host\server`.

## MVP resuelto

1. Entrar con nombre.
2. Ver jugadores conectados.
3. Mover jugador con click.
4. Recibir movimiento de otros jugadores en tiempo real.
5. Enviar chat global.
6. Enviar solicitudes de amistad.
7. Aceptar amistades pendientes.
8. Chatear en privado con amigos conectados.

## Estructura actual

```text
/backend
/frontend
  /src
    /game
    /network
```

## Siguiente fase recomendada

### Backend siguiente

Agregar:

- Solicitudes de amistad
- Chat privado entre amigos
- Salas o minijuegos
- Persistencia con SQLite o PostgreSQL

### LAN auto-discovery

No lo hagas en la primera iteracion. Primero valida bien:

- Conexion al hub
- Movimiento
- Chat
- Reconexion

Luego agrega un pequeno servicio UDP Broadcast aparte para que los clientes descubran al host.
