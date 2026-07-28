@echo off
REM Script para iniciar Gym11 en local
cd /d "%~dp0"
echo ========================================
echo   Gym11 - Desarrollo local
echo ========================================
echo.
echo La aplicacion estara disponible en: http://localhost:5173
echo.
echo Presiona Ctrl+C para detener la aplicacion
echo.

start "" "http://localhost:5173"
call npm.cmd run dev

pause
