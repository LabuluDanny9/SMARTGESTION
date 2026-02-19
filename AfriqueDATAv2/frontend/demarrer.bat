@echo off
echo Smart Gestion - Demarrage...
cd /d "%~dp0"

REM Liberer le port 3002
powershell -Command "$c = Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue; if ($c) { $c | %% { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }; Start-Sleep -Seconds 3 }"

echo Lancement sur http://localhost:3002
set BROWSER=none
call npm start
pause
