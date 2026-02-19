# Script de lancement Smart Gestion - libere le port avant de demarrer
Write-Host "Smart Gestion - Demarrage..." -ForegroundColor Cyan

# Liberer le port 3002
$conns = Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue
if ($conns) {
    Write-Host "Liberation du port 3002..." -ForegroundColor Yellow
    $conns | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 3
}

Set-Location $PSScriptRoot
Write-Host "Lancement du serveur sur http://localhost:3002" -ForegroundColor Green
$env:BROWSER = 'none'
npm start
