@echo off
setlocal
cd /d "%~dp0"

echo Iniciando Island Game en modo host...
start "Island Host" powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0scripts\Start-Host.ps1"

echo.
echo Backend:  http://localhost:5000
echo Juego:    http://localhost:5000
echo.
echo En otros dispositivos de la misma red, usen la IP del host.
endlocal
