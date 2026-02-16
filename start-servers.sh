#!/bin/bash
echo "====== MinzoAI Full Stack Server ======"
echo ""
echo "Starting Backend (Port 3001)..."
cd "/c/Users/Work&Study/Desktop/MinzoAI/backend"
node server.js &
BACKEND_PID=$!

sleep 3

echo ""
echo "Starting Frontend (Port 3000)..."
cd "/c/Users/Work&Study/Desktop/MinzoAI/client/public"
node server.js &
FRONTEND_PID=$!

sleep 2

echo ""
echo "========== SERVERS STARTED =========="
echo "Frontend:  http://localhost:3000"
echo "Backend:   http://localhost:3001"
echo ""
echo "Backend PID:  $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "======================================="

wait
