@echo off
echo Iniciando DPS Desk (frontend)...
echo Backend: https://dps-desk.onrender.com
start "DPS Frontend" cmd /k "cd /d "%~dp0project" && npx kill-port 8080 && npx serve . -p 8080"

