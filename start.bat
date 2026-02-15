@echo off
REM Quick Start Script for Phishing Email Detector
REM Run this script to set up and start the entire system

echo.
echo ========================================
echo  Phishing Email Detector - Quick Start
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

echo [✓] Python found
echo.

REM Navigate to backend
cd backend
echo [*] Setting up backend in %CD%
echo.

REM Install dependencies
echo [*] Installing Python packages...
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo [✓] Dependencies installed
echo.

REM Train models
echo [*] Training ML models...
echo This may take a minute on first run...
python train_models.py
if errorlevel 1 (
    echo [ERROR] Model training failed
    pause
    exit /b 1
)

echo [✓] Models trained successfully
echo.

REM Start API server
echo ========================================
echo [*] Starting FastAPI server...
echo ========================================
echo.
echo API will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.
echo Keep this window open while using the extension.
echo Press Ctrl+C to stop the server.
echo.
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000

pause
