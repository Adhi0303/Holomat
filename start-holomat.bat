@echo off
echo ========================================
echo   Starting HoloMat Application
echo ========================================
echo.

echo [1/2] Starting Backend (Port 8001)...
start "HoloMat Backend" cmd /k "cd holomat-backend && python -m uvicorn main:app --reload --port 8001"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend (Port 5173)...
start "HoloMat Frontend" cmd /k "cd \"frontend UI\" && npm run dev"

echo.
echo ========================================
echo   HoloMat is starting...
echo   Backend:  http://localhost:8001
echo   Frontend: http://localhost:5173
echo ========================================
echo.
echo Press any key to exit this window...
pause >nul
