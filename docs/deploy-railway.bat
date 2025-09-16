@echo off
echo 🚀 CopyFlow Health Dashboard - Railway Deployment
echo ===============================================

echo 📋 Checking Railway CLI...
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Railway CLI not found. Installing...
    npm install -g @railway/cli
    if %errorlevel% neq 0 (
        echo ❌ Failed to install Railway CLI
        echo 💡 Please install manually: npm install -g @railway/cli
        pause
        exit /b 1
    )
)

echo ✅ Railway CLI found
echo.

echo 🔐 Logging into Railway...
railway login
if %errorlevel% neq 0 (
    echo ❌ Railway login failed
    pause
    exit /b 1
)

echo ✅ Logged into Railway
echo.

echo 🏗️ Creating Railway project...
railway init
if %errorlevel% neq 0 (
    echo ❌ Failed to create Railway project
    pause
    exit /b 1
)

echo ✅ Railway project created
echo.

echo 🗄️ Adding PostgreSQL database...
railway add postgresql
if %errorlevel% neq 0 (
    echo ❌ Failed to add PostgreSQL
    pause
    exit /b 1
)

echo ✅ PostgreSQL added
echo.

echo ⚙️ Setting environment variables...

REM Basic configuration
railway variables:set NODE_ENV=production
railway variables:set MONITORING_ENABLED=true
railway variables:set LOG_LEVEL=info

REM Dashboard configuration
railway variables:set DASHBOARD_REFRESH_INTERVAL=30000
railway variables:set HEALTH_CHECK_INTERVAL=60000
railway variables:set METRICS_RETENTION_DAYS=90

REM Alert thresholds
railway variables:set RESPONSE_TIME_WARNING=2000
railway variables:set RESPONSE_TIME_CRITICAL=5000
railway variables:set SUCCESS_RATE_WARNING=95
railway variables:set SUCCESS_RATE_CRITICAL=90
railway variables:set ERROR_RATE_WARNING=5
railway variables:set ERROR_RATE_CRITICAL=10

echo ✅ Basic environment variables set
echo.

echo 🚀 Deploying to Railway...
railway up
if %errorlevel% neq 0 (
    echo ❌ Deployment failed
    echo 📋 Check logs: railway logs
    pause
    exit /b 1
)

echo ✅ Deployment successful!
echo.

echo 🗄️ Setting up database...
railway run npx prisma db push
if %errorlevel% neq 0 (
    echo ❌ Database setup failed
    echo 📋 Check logs: railway logs
    pause
    exit /b 1
)

echo ✅ Database setup completed!
echo.

echo 🎉 Deployment completed successfully!
echo.
echo 📊 Your dashboard is now available at:
railway status | findstr "URL"
echo.
echo 📋 Useful commands:
echo   railway logs       - View application logs
echo   railway status     - Check deployment status
echo   railway open       - Open dashboard in browser
echo.
echo ⚙️ Next steps:
echo   1. Set your OpenAI API keys: railway variables:set OPENAI_API_KEY=your-key
echo   2. Configure email alerts: railway variables:set SMTP_USER=your-email
echo   3. Set main project URL: railway variables:set MAIN_PROJECT_API_URL=your-url
echo.
pause
