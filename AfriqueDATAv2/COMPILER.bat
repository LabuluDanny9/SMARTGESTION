@echo off
chcp 65001 >nul
title Smart Gestion - Compilation

cd /d "%~dp0frontend"

echo ============================================
echo   SMART GESTION - Compilation
echo ============================================
echo.
echo Prerequis: creez frontend\.env avec vos cles Supabase
echo            (copiez depuis frontend\.env.example)
echo.

echo Installation des dependances (si necessaire)...
call npm install
if errorlevel 1 (
    echo ERREUR: npm install a échoué.
    pause
    exit /b 1
)

echo.
echo Compilation en cours...
call npm run build
if errorlevel 1 (
    echo ERREUR: La compilation a échoué.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Compilation reussie !
echo   Les fichiers sont dans: frontend\build\
echo.
echo   Pour lancer: double-cliquez sur LANCER.bat
echo ============================================
pause
