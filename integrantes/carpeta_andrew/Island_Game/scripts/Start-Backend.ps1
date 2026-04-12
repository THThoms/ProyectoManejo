$ErrorActionPreference = "Stop"

Set-Location (Join-Path $PSScriptRoot "..\backend")

Write-Host "Island backend iniciando en http://0.0.0.0:5000" -ForegroundColor Cyan
Write-Host "Cierra esta ventana para detener el backend." -ForegroundColor DarkGray
Write-Host ""

dotnet run
