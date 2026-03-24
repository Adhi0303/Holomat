#!/bin/bash

echo "========================================"
echo "  Starting HoloMat Application"
echo "========================================"
echo ""

echo "[1/2] Starting Backend (Port 8001)..."
cd holomat-backend
python -m uvicorn main:app --reload --port 8001 &
BACKEND_PID=$!
cd ..

sleep 2

echo "[2/2] Starting Frontend (Port 5173)..."
cd "frontend UI"
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "  HoloMat is running!"
echo "  Backend:  http://localhost:8001"
echo "  Frontend: http://localhost:5173"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop both services..."

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
