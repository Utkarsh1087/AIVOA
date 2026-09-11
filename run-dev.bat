@echo off
echo ===================================================
echo   AIVOA - AI Pharmaceutical QMS Copilot
echo   Starting Local Development Environment...
echo ===================================================

echo [1/2] Launching FastAPI Backend on http://localhost:8000 ...
start "AIVOA Backend" cmd /k "cd backend && python main.py"

echo [2/2] Launching React Frontend on http://localhost:5173 ...
start "AIVOA Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Application is starting!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://localhost:8000/docs
echo ===================================================
