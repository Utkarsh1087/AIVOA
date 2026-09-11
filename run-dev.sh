#!/bin/bash
echo "==================================================="
echo "  AIVOA - AI Pharmaceutical QMS Copilot"
echo "  Starting Local Development Environment..."
echo "==================================================="

# Start backend in background
echo "[1/2] Starting FastAPI Backend on http://localhost:8000 ..."
(cd backend && python main.py) &
BACKEND_PID=$!

# Start frontend in background
echo "[2/2] Starting React Frontend on http://localhost:5173 ..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "App running!"
echo "Frontend: http://localhost:5173"
echo "Backend Docs: http://localhost:8000/docs"
echo "Press Ctrl+C to terminate both servers."

trap "kill $BACKEND_PID $FRONTEND_PID" SIGINT SIGTERM
wait
