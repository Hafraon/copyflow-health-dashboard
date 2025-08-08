#!/bin/bash
# CopyFlow Health Dashboard - Automated Setup Script

echo "🚀 Setting up CopyFlow Health Dashboard..."
echo "============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "⚠️ PostgreSQL CLI not found. Make sure PostgreSQL is installed and running."
fi

echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️ Please edit .env file with your configuration before continuing"
    echo "📄 Required: MONITORING_DATABASE_URL"
    echo "📧 Optional: SMTP credentials for email alerts"
    echo "📱 Optional: Telegram bot credentials"
    echo ""
    echo "Example PostgreSQL URL:"
    echo "MONITORING_DATABASE_URL=\"postgresql://postgres:password@localhost:5432/copyflow_monitoring\""
    echo ""
    echo "Press Enter after configuring .env file..."
    read
fi

echo "🗄️ Setting up database..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo "📊 Creating database tables..."
npx prisma db push

if [ $? -ne 0 ]; then
    echo "❌ Failed to create database tables"
    echo "💡 Make sure your database is running and MONITORING_DATABASE_URL is correct"
    exit 1
fi

echo "✅ Database setup completed"

echo "🧪 Testing configuration..."

# Test database connection
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✅ Database connection successful');
    process.exit(0);
  })
  .catch((error) => {
    console.log('❌ Database connection failed:', error.message);
    process.exit(1);
  });
" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "⚠️ Database connection test failed. Please check your configuration."
fi

echo ""
echo "🎉 Setup completed successfully!"
echo "🚀 Starting development server..."
echo ""
echo "Dashboard will be available at: http://localhost:3001"
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
