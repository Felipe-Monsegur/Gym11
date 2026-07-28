@echo off
REM Publicar Gym11 en Firebase Hosting (proyecto gym11-1111)
cd /d "%~dp0"
echo ========================================
echo   Publicar Gym11 en Firebase
echo ========================================
echo.

echo Paso 1: Construyendo la aplicacion...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: La construccion fallo
    pause
    exit /b 1
)
echo.

echo Paso 2: Desplegando en Firebase Hosting...
firebase deploy --only hosting --project gym11-1111
if %errorlevel% neq 0 (
    echo ERROR: El despliegue fallo
    echo Asegurate de haber ejecutado: firebase login
    pause
    exit /b 1
)
echo.

echo ========================================
echo   Publicacion completada!
echo ========================================
echo.
echo URL: https://gym11-1111.web.app
echo GitHub: https://github.com/Felipe-Monsegur/Gym11
echo.
pause
