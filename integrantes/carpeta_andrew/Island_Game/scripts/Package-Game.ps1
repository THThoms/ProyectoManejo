$ErrorActionPreference = "Stop"

$root = Join-Path $PSScriptRoot ".."
$frontendPath = Join-Path $root "frontend"
$backendPath = Join-Path $root "backend"
$hostLauncherPath = Join-Path $root "tools\HostLauncher"
$clientLauncherPath = Join-Path $root "tools\ClientLauncher"
$brandingScriptPath = Join-Path $PSScriptRoot "Setup-Branding.ps1"
$distPath = Join-Path $root "dist"
$hostDistPath = Join-Path $distPath "Host"
$clientDistPath = Join-Path $distPath "Client"
$serverDistPath = Join-Path $hostDistPath "server"
$frontendDistPath = Join-Path $frontendPath "dist"

if (Test-Path $distPath) {
    try {
        Remove-Item -LiteralPath $distPath -Recurse -Force
    }
    catch {
        Write-Host ""
        Write-Host "No se pudo limpiar la carpeta dist porque hay archivos en uso." -ForegroundColor Red
        Write-Host "Cierra cualquier servidor o ejecutable de Island Game que este corriendo desde dist y vuelve a intentar." -ForegroundColor Yellow
        Write-Host ""
        throw
    }
}

& $brandingScriptPath

New-Item -ItemType Directory -Path $hostDistPath | Out-Null
New-Item -ItemType Directory -Path $clientDistPath | Out-Null

Set-Location $frontendPath
if (-not (Test-Path "node_modules")) {
    npm install
}

Write-Host "Compilando frontend..." -ForegroundColor Cyan
npm run build

Set-Location $backendPath
Write-Host "Publicando backend..." -ForegroundColor Cyan
dotnet publish .\IslandGame.Backend.csproj -c Release -r win-x64 --self-contained false -o $serverDistPath

if (Test-Path (Join-Path $serverDistPath "wwwroot")) {
    Remove-Item -LiteralPath (Join-Path $serverDistPath "wwwroot") -Recurse -Force
}

Copy-Item -Path $frontendDistPath -Destination (Join-Path $serverDistPath "wwwroot") -Recurse

Set-Location $hostLauncherPath
Write-Host "Publicando HostLauncher.exe..." -ForegroundColor Cyan
dotnet publish .\IslandGame.HostLauncher.csproj -c Release -r win-x64 --self-contained false -o $hostDistPath

Set-Location $clientLauncherPath
Write-Host "Publicando ClientLauncher.exe..." -ForegroundColor Cyan
dotnet publish .\IslandGame.ClientLauncher.csproj -c Release -r win-x64 --self-contained false -o $clientDistPath

Write-Host "Creando accesos directos..." -ForegroundColor Cyan
& $brandingScriptPath -CreateShortcutsOnly

Write-Host ""
Write-Host "Empaquetado completo." -ForegroundColor Green
Write-Host "Host:   $hostDistPath"
Write-Host "Client: $clientDistPath"
