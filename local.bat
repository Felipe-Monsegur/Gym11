@echo off
REM Script para iniciar la aplicación Finanzas 11 automáticamente
REM Este script se puede agregar al inicio de Windows para ejecutar la app automáticamente

cd /d "%~dp0"
echo Iniciando Finanzas 11...
echo.
echo La aplicacion estara disponible en: http://localhost:5173
echo.
echo Presiona Ctrl+C para detener la aplicacion
echo.

REM Ejecutar npm run dev
call npm.cmd run dev

pause

