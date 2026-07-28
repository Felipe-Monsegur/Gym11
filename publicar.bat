@echo off
echo ========================================
echo   Publicar Finanzas 11 en Firebase
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
firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo ERROR: El despliegue fallo
    echo Asegurate de haber ejecutado: firebase login
    pause
    exit /b 1
)
echo.

echo ========================================
echo   ¡Publicacion completada!
echo ========================================
echo.
echo Tu aplicacion esta disponible en la URL que se mostro arriba.
echo Puedes acceder desde cualquier dispositivo, incluyendo tu celular.
echo.
pause

