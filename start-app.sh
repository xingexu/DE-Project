#!/bin/bash

echo "🚀 Starting Transit Rewards App..."

# Function to kill background processes on exit
cleanup() {
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Set up cleanup on script exit
trap cleanup EXIT INT TERM

# Start backend server
echo "📡 Starting backend server on port 5001..."
cd backend && node src/server-simple.js &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend server
echo "🌐 Starting frontend server on port 5173..."
cd /Users/harrisonwang/DE-Project-1 && npm run dev &
FRONTEND_PID=$!

# Wait for both servers to start
sleep 3

echo "✅ Both servers are running!"
echo "🔗 Frontend: http://localhost:5173"
echo "🔗 Backend API: http://localhost:5001"
echo "🔗 Health Check: http://localhost:5001/health"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
wait
