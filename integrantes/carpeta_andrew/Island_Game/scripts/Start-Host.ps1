$ErrorActionPreference = "Stop"

$root = Join-Path $PSScriptRoot ".."
$frontendPath = Join-Path $root "frontend"
$backendPath = Join-Path $root "backend"

function Test-IslandServerRunning {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 2
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

function Test-Port5000Open {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $client.BeginConnect("127.0.0.1", 5000, $null, $null)
        $connected = $async.AsyncWaitHandle.WaitOne(1000, $false)
        if (-not $connected) {
            return $false
        }

        $client.EndConnect($async)
        return $true
    }
    catch {
        return $false
    }
    finally {
        $client.Dispose()
    }
}

Set-Location $frontendPath

if (-not (Test-Path "node_modules")) {
    Write-Host "No se encontraron dependencias del frontend." -ForegroundColor Yellow
    Write-Host "Instalando dependencias..." -ForegroundColor Cyan
    npm install
}

Write-Host "Compilando frontend..." -ForegroundColor Cyan
npm run build

Set-Location $backendPath
Write-Host ""
if (Test-IslandServerRunning) {
    Write-Host "Ya existe un servidor de Island Game en http://localhost:5000" -ForegroundColor Yellow
    Write-Host "Se reutilizara ese servidor en lugar de iniciar otro." -ForegroundColor DarkGray
    Write-Host ""
    Start-Process "http://localhost:5000"
    Write-Host "Cierra esta ventana o presiona Ctrl+C si solo querias abrir el juego." -ForegroundColor DarkGray
    Write-Host ""
    return
}

if (Test-Port5000Open) {
    Write-Host "El puerto 5000 ya esta ocupado por otra aplicacion." -ForegroundColor Red
    Write-Host "Cierra esa aplicacion o cambia el puerto antes de iniciar Island Game." -ForegroundColor Yellow
    Write-Host ""
    return
}

Write-Host "Island host iniciando en http://0.0.0.0:5000" -ForegroundColor Cyan
Write-Host "El backend servira tambien la interfaz del juego." -ForegroundColor DarkGray
Write-Host "Cierra esta ventana para detener el host." -ForegroundColor DarkGray
Write-Host ""

Start-Job -ScriptBlock {
    for ($i = 0; $i -lt 30; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -eq 200) {
                Start-Process "http://localhost:5000"
                return
            }
        }
        catch {
        }

        Start-Sleep -Seconds 1
    }
} | Out-Null

dotnet run --no-launch-profile
