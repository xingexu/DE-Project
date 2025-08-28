#!/bin/bash

echo "🚀 Setting up Transit Rewards Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed. You can:"
    echo "   1. Install PostgreSQL locally"
    echo "   2. Use Docker (recommended for development)"
    echo ""
    read -p "Do you want to use Docker? (y/n): " use_docker
    
    if [[ $use_docker =~ ^[Yy]$ ]]; then
        echo "🐳 Using Docker setup..."
        if ! command -v docker &> /dev/null; then
            echo "❌ Docker is not installed. Please install Docker first."
            exit 1
        fi
        
        echo "✅ Docker detected"
        echo "🚀 Starting services with Docker Compose..."
        docker-compose up -d
        
        echo "⏳ Waiting for database to be ready..."
        sleep 10
        
        echo "🌱 Running database migrations..."
        docker-compose exec backend npm run db:migrate
        
        echo "🌱 Seeding database..."
        docker-compose exec backend npm run db:seed
        
        echo "🎉 Setup complete! Your backend is running at http://localhost:5000"
        echo "📊 Database management: http://localhost:5050 (admin@transit.com / admin123)"
        echo "🔗 Health check: http://localhost:5000/health"
        exit 0
    else
        echo "❌ Please install PostgreSQL and run the setup again."
        exit 1
    fi
fi

echo "✅ PostgreSQL detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your database credentials"
    echo "   Then run: npm run db:migrate"
else
    echo "✅ .env file already exists"
fi

# Check if database exists
echo "🗄️  Checking database connection..."
if npm run db:migrate 2>/dev/null; then
    echo "✅ Database setup complete!"
    
    echo "🌱 Seeding database..."
    npm run db:seed
    
    echo "🎉 Setup complete! Your backend is ready."
    echo "🚀 Start the server with: npm run dev"
    echo "🔗 Health check: http://localhost:5000/health"
else
    echo "❌ Database setup failed. Please check your .env file and database connection."
    echo "   Make sure PostgreSQL is running and the database 'transit_rewards' exists."
    exit 1
fi

