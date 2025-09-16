@echo off
echo 🚀 CopyFlow Health Dashboard - Quick Start
echo ==========================================

echo 📊 Generating Prisma client...
call npm run db:generate
if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    pause
    exit /b 1
)

echo 🗄️ Setting up SQLite database...
call npm run db:push
if %errorlevel% neq 0 (
    echo ❌ Failed to setup database
    pause
    exit /b 1
)

echo ✅ Database setup completed!
echo 🚀 Starting dashboard...
echo.
echo Dashboard will be available at: http://localhost:3001
echo Press Ctrl+C to stop
echo.

call npm run dev
