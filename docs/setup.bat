@echo off
REM CopyFlow Health Dashboard - Windows Setup Script

echo 🚀 Setting up CopyFlow Health Dashboard...
echo =============================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo 📦 Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Check if .env file exists
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ⚠️ Please edit .env file with your configuration before continuing
    echo 📄 Required: MONITORING_DATABASE_URL
    echo 📧 Optional: SMTP credentials for email alerts
    echo 📱 Optional: Telegram bot credentials
    echo.
    echo Example PostgreSQL URL:
    echo MONITORING_DATABASE_URL="postgresql://postgres:password@localhost:5432/copyflow_monitoring"
    echo.
    echo Press Enter after configuring .env file...
    pause >nul
)

echo 🗄️ Setting up database...
call npx prisma generate

if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    pause
    exit /b 1
)

echo 📊 Creating database tables...
call npx prisma db push

if %errorlevel% neq 0 (
    echo ❌ Failed to create database tables
    echo 💡 Make sure your database is running and MONITORING_DATABASE_URL is correct
    pause
    exit /b 1
)

echo ✅ Database setup completed

echo.
echo 🎉 Setup completed successfully!
echo 🚀 Starting development server...
echo.
echo Dashboard will be available at: http://localhost:3001
echo Press Ctrl+C to stop the server
echo.

call npm run dev
