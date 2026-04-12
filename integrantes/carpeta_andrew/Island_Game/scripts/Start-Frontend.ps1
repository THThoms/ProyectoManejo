$ErrorActionPreference = "Stop"

Set-Location (Join-Path $PSScriptRoot "..\frontend")

if (-not (Test-Path "node_modules")) {
    Write-Host "No se encontraron dependencias del frontend." -ForegroundColor Yellow
    Write-Host "Ejecuta 'npm install' en la carpeta frontend antes de iniciar el juego." -ForegroundColor Yellow
    Write-Host ""
    Pause
    exit 1
}

Write-Host "Island frontend iniciando en http://0.0.0.0:5173" -ForegroundColor Cyan
Write-Host "Cierra esta ventana para detener el frontend." -ForegroundColor DarkGray
Write-Host ""

npm run dev
