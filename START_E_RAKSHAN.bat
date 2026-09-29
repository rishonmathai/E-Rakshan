@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo E-Rakshan integrated startup
echo ========================================

echo [1/3] Starting Django/PostGIS/Redis/Celery...
start "E-Rakshan Backend" cmd /k "cd /d "%~dp0E-Rakshan-backend" && docker compose up --build"

timeout /t 5 /nobreak >nul

echo [2/3] Starting React frontend...
start "E-Rakshan Frontend" cmd /k "cd /d "%~dp0E-Rakshan-frontend" && if not exist node_modules npm install && npm run dev"

echo [3/3] Starting SAI voice bridge...
start "SAI Voice Bridge" cmd /k "cd /d "%~dp0E-Rakshan-frontend\backend" && start_sai_voice.bat"

echo.
echo E-Rakshan services are starting in separate windows.
echo Frontend: http://localhost:5173
echo Backend:  http://127.0.0.1:8000
pause
