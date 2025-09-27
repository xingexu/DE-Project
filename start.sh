#!/bin/bash

# Display ASCII art
echo "
╔════════════════════════════════════════════════════╗
║                                                    ║
║   ████████╗██████╗  █████╗ ███╗   ██╗███████╗██╗████████╗  ║
║   ╚══██╔══╝██╔══██╗██╔══██╗████╗  ██║██╔════╝██║╚══██╔══╝  ║
║      ██║   ██████╔╝███████║██╔██╗ ██║███████╗██║   ██║     ║
║      ██║   ██╔══██╗██╔══██║██║╚██╗██║╚════██║██║   ██║     ║
║      ██║   ██║  ██║██║  ██║██║ ╚████║███████║██║   ██║     ║
║      ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝   ╚═╝     ║
║                                                    ║
╚════════════════════════════════════════════════════╝
"

echo "🚀 Starting TransporTauTion Application..."
echo

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL status..."
pg_status=$(pg_isready 2>/dev/null)
pg_exit_code=$?

if [ $pg_exit_code -ne 0 ]; then
  echo "❌ PostgreSQL is not running. Starting PostgreSQL..."
  
  # Try to start PostgreSQL - different commands based on OS
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    brew services start postgresql 2>/dev/null || \
    pg_ctl -D /usr/local/var/postgres start 2>/dev/null || \
    pg_ctl -D /opt/homebrew/var/postgres start 2>/dev/null
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    sudo service postgresql start 2>/dev/null || \
    sudo systemctl start postgresql 2>/dev/null
  else
    echo "❌ Unsupported OS, please start PostgreSQL manually."
    exit 1
  fi
  
  echo "✅ PostgreSQL started"
else
  echo "✅ PostgreSQL is running"
fi

# Setup and start the backend
echo
echo "🛠️  Setting up backend..."
cd backend
npm install
npm run setup

# Start backend in background
echo "🔄 Starting backend server..."
npm run dev &
BACKEND_PID=$!

# Go back to root
cd ..

# Install frontend dependencies if needed
echo
echo "🛠️  Setting up frontend..."
npm install

# Start frontend
echo "🔄 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

echo
echo "✨ Application is running!"
echo "📊 Frontend: http://localhost:5173"
echo "🔌 Backend: http://localhost:5000"
echo
echo "Press Ctrl+C to stop all servers"

# Function to handle SIGINT (Ctrl+C)
cleanup() {
  echo
  echo "🛑 Stopping servers..."
  kill $BACKEND_PID
  kill $FRONTEND_PID
  echo "✅ Servers stopped"
  exit 0
}

trap cleanup SIGINT

# Wait for user to press Ctrl+C
while true; do
  sleep 1
done
