param(
    [string]$HostAddress
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($HostAddress)) {
    $HostAddress = Read-Host "Ingresa la IP del host o localhost"
}

if ([string]::IsNullOrWhiteSpace($HostAddress)) {
    $HostAddress = "localhost"
}

$targetUrl = "http://$HostAddress`:5000"

Write-Host "Abriendo juego en $targetUrl" -ForegroundColor Cyan
Start-Process $targetUrl
