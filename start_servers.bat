@echo off
title AI-Powered Student Result Management System Launcher
echo ==========================================================
echo  Starting AI-Powered Student Result Management System...
echo ==========================================================
echo.

:: Check for Python installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in system PATH.
    echo Please install Python 3.10+ and try again.
    pause
    exit /b 1
)

:: Check for Node.js installation
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in system PATH.
    echo Please install Node.js (v18+) and try again.
    pause
    exit /b 1
)

:: 1. Launch FastAPI Backend
echo [INFO] Starting FastAPI Backend on Port 8000...
start "FastAPI Backend" cmd /c "echo Installing Backend Dependencies... && python -m pip install -r backend\requirements.txt && echo Starting Uvicorn... && uvicorn backend.app.main:app --reload --port 8000"

:: 2. Launch Vite React Frontend
echo [INFO] Starting React Frontend...
start "Vite React Frontend" cmd /c "cd frontend && echo Starting Vite Dev Server... && npm run dev"

echo.
echo ==========================================================
echo  Launcher finished.
echo  - Backend API:   http://localhost:8000
echo  - Frontend App:  http://localhost:5173
echo.
echo  Keep the newly opened command windows running!
echo ==========================================================
pause
