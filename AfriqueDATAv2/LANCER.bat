@echo off
chcp 65001 >nul
title Smart Gestion - Salle du Numérique

cd /d "%~dp0frontend"

echo ============================================
echo   SMART GESTION - Lancement
echo ============================================
echo.

REM Vérifier si le build existe
if not exist "build\index.html" (
    echo [1/3] Compilation en cours...
    call npm run build
    if errorlevel 1 (
        echo ERREUR: La compilation a échoué.
        pause
        exit /b 1
    )
    echo.
) else (
    echo [OK] Version compilée trouvée.
    echo.
)

echo [2/3] Demarrage du serveur...
echo.
echo   L'application sera accessible sur:
echo   http://localhost:3000
echo.
echo   Appuyez sur Ctrl+C pour arrêter.
echo ============================================
echo.

start "" "http://localhost:3000"
call npm run serve

pause
