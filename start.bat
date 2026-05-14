@echo off
echo Iniciando DPS Desk...
start "DPS Backend"  cmd /k "cd /d "%~dp0backend" && npm start"
start "DPS Frontend" cmd /k "cd /d "%~dp0project" && npx kill-port 8080 && npx serve . -p 8080"

