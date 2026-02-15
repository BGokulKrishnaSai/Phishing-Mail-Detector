#!/bin/bash
# Quick Start Script for Phishing Email Detector (Linux/Mac)
# Run: chmod +x start.sh && ./start.sh

echo ""
echo "========================================"
echo " Phishing Email Detector - Quick Start"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed"
    echo "Please install Python 3.8+ from https://www.python.org/"
    exit 1
fi

echo "[✓] Python found: $(python3 --version)"
echo ""

# Navigate to backend
cd backend
echo "[*] Setting up backend in $(pwd)"
echo ""

# Install dependencies
echo "[*] Installing Python packages..."
pip3 install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install dependencies"
    exit 1
fi

echo "[✓] Dependencies installed"
echo ""

# Train models
echo "[*] Training ML models..."
echo "This may take a minute on first run..."
python3 train_models.py
if [ $? -ne 0 ]; then
    echo "[ERROR] Model training failed"
    exit 1
fi

echo "[✓] Models trained successfully"
echo ""

# Start API server
echo "========================================"
echo "[*] Starting FastAPI server..."
echo "========================================"
echo ""
echo "API will be available at: http://localhost:8000"
echo "API Documentation: http://localhost:8000/docs"
echo ""
echo "Keep this window open while using the extension."
echo "Press Ctrl+C to stop the server."
echo ""

python3 -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
