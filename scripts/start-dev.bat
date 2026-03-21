@echo off
setlocal

for %%I in ("%~dp0..") do set "ROOT=%%~fI"

if not exist "%ROOT%\server\data" mkdir "%ROOT%\server\data"
if not exist "%ROOT%\server\data\users.json" echo []>"%ROOT%\server\data\users.json"

echo Starting backend...
start "Diploma Backend" cmd /k "cd /d ""%ROOT%\server"" && npm install && npm run dev"

echo Starting frontend...
cd /d "%ROOT%\my-app"
call npm install
call npm start

endlocal