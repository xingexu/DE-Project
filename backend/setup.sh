#!/bin/bash

echo "🚀 Setting up TransportTauTion backend..."

# Check if .env exists, if not create it from example
if [ ! -f .env ]; then
  echo "📝 Creating .env from env.example..."
  cp env.example .env
  
  # Generate a secure JWT secret
  JWT_SECRET=$(openssl rand -hex 32)
  sed -i '' "s/your_super_secret_jwt_key_here/$JWT_SECRET/g" .env
  
  echo "✅ Created .env file with secure JWT secret"
else
  echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create database
echo "🗄️ Setting up database..."

# Check if psql is available (PostgreSQL)
if command -v psql &> /dev/null; then
  echo "✅ PostgreSQL found"
  
  # Extract database info from .env
  DB_NAME=$(grep DB_NAME .env | cut -d '=' -f2)
  DB_USER=$(grep DB_USER .env | cut -d '=' -f2)
  
  # Check if database exists
  if psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "✅ Database $DB_NAME already exists"
  else
    echo "🔨 Creating database $DB_NAME..."
    createdb $DB_NAME
    echo "✅ Database created"
  fi
  
  # Run migrations
  echo "🔄 Running database migrations..."
  node src/config/migrate.js
  
  # Seed database with initial data
  echo "🌱 Seeding database with initial data..."
  node src/config/seed.js
else
  echo "❌ PostgreSQL not found. Please install PostgreSQL and try again."
  echo "📝 You can still continue setup, but you'll need to set up the database manually."
fi

echo "🎉 Backend setup complete!"
echo "To start the server, run: npm start"