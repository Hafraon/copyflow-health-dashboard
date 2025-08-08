# 🚀 CopyFlow Health Dashboard - Railway Deployment Guide

## 📋 **Pre-Deployment Checklist**

### **✅ Local Testing**
- [ ] Dashboard runs locally without errors
- [ ] Database connection working
- [ ] All environment variables configured
- [ ] Email alerts tested (if configured)
- [ ] Telegram alerts tested (if configured)
- [ ] Health API responding
- [ ] Metrics API working

### **✅ Production Preparation**
- [ ] Railway account created
- [ ] PostgreSQL addon ready
- [ ] Domain name ready (optional)
- [ ] Production SMTP credentials
- [ ] Production Telegram bot token

---

## 🚀 **Railway Deployment Steps**

### **Step 1: Install Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

### **Step 2: Initialize Railway Project**
```bash
# In admin-dashboard directory
cd "E:\Claude control\CopyFlow\admin-dashboard"

# Initialize Railway project
railway init

# Choose: "Create new project"
# Project name: "copyflow-health-dashboard"
```

### **Step 3: Add PostgreSQL Database**
```bash
# Add PostgreSQL addon
railway add postgresql

# Check database URL
railway variables
```

### **Step 4: Configure Environment Variables**
```bash
# Set production environment variables
railway variables:set NODE_ENV=production
railway variables:set PORT=3001

# Database (automatically set by PostgreSQL addon)
# railway variables:set MONITORING_DATABASE_URL=${{PostgreSQL.DATABASE_URL}}

# Main project URL (update after main project is deployed)
railway variables:set MAIN_PROJECT_API_URL=https://copyflow-main.railway.app

# Dashboard configuration
railway variables:set DASHBOARD_REFRESH_INTERVAL=30000
railway variables:set HEALTH_CHECK_INTERVAL=60000
railway variables:set METRICS_RETENTION_DAYS=90

# Alert thresholds
railway variables:set RESPONSE_TIME_WARNING=2000
railway variables:set RESPONSE_TIME_CRITICAL=5000
railway variables:set SUCCESS_RATE_WARNING=95
railway variables:set SUCCESS_RATE_CRITICAL=90
railway variables:set ERROR_RATE_WARNING=5
railway variables:set ERROR_RATE_CRITICAL=10

# Email alerts (optional)
railway variables:set SMTP_HOST=smtp.gmail.com
railway variables:set SMTP_PORT=587
railway variables:set SMTP_USER=your-email@gmail.com
railway variables:set SMTP_PASS=your-app-password
railway variables:set ALERT_EMAIL_FROM="CopyFlow Alerts <alerts@copyflow.com>"
railway variables:set ALERT_EMAIL_TO=admin@copyflow.com

# Telegram alerts (optional)
railway variables:set TELEGRAM_BOT_TOKEN=your-bot-token
railway variables:set TELEGRAM_CHAT_ID=your-chat-id

# Monitoring settings
railway variables:set MONITORING_ENABLED=true
railway variables:set LOG_LEVEL=info
```

### **Step 5: Deploy**
```bash
# Deploy to Railway
railway up

# Check deployment status
railway status

# View logs
railway logs
```

### **Step 6: Setup Database**
```bash
# Connect to Railway for database setup
railway run npx prisma db push

# Generate Prisma client
railway run npx prisma generate
```

---

## 🌐 **Custom Domain Setup**

### **Option 1: Railway Subdomain**
Your dashboard will be available at:
`https://copyflow-health-dashboard-production.up.railway.app`

### **Option 2: Custom Domain**
```bash
# Add custom domain in Railway dashboard
# DNS settings for your domain:

# CNAME record:
# status.copyflow.com → copyflow-health-dashboard-production.up.railway.app

# Update environment variable:
railway variables:set DOMAIN=https://status.copyflow.com
```

---

## 🔧 **Post-Deployment Configuration**

### **1. Test Deployment**
```bash
# Test health endpoint
curl https://your-dashboard.railway.app/api/health

# Test metrics endpoint
curl https://your-dashboard.railway.app/api/metrics
```

### **2. Update Main Project**
Add monitoring integration to your main CopyFlow project:

```typescript
// In main project .env
MONITORING_ENABLED="true"
MONITORING_DASHBOARD_URL="https://your-dashboard.railway.app"
```

### **3. Test Alerts**
```bash
# Test email alerts
railway run node -e "
const { emailAlertService } = require('./lib/alerts/email');
emailAlertService.testConnection().then(console.log);
"

# Test Telegram alerts
railway run node -e "
const { telegramAlertService } = require('./lib/alerts/telegram');
telegramAlertService.testConnection().then(console.log);
"
```

---

## 📊 **Monitoring Setup**

### **1. Health Checks**
Set up external monitoring (optional):
- UptimeRobot: Monitor `https://your-dashboard.railway.app/api/health`
- Pingdom: Check dashboard availability
- StatusCake: Monitor response times

### **2. Log Monitoring**
```bash
# View real-time logs
railway logs --tail

# View specific service logs
railway logs --service postgresql
```

### **3. Performance Monitoring**
Monitor Railway app performance:
- Railway dashboard metrics
- Database connection pool
- Memory and CPU usage
- Request response times

---

## 🔄 **Continuous Deployment**

### **Option 1: GitHub Integration**
```bash
# Connect GitHub repository
railway connect github

# Automatic deployments on push to main branch
```

### **Option 2: Manual Deployment**
```bash
# Deploy updates
git add .
git commit -m "Update dashboard"
railway up
```

---

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **Database Connection Failed**
```bash
# Check database status
railway status

# Verify environment variables
railway variables

# Test database connection
railway run npx prisma db push
```

#### **Build Failed**
```bash
# Check build logs
railway logs --deployment [deployment-id]

# Common fixes:
railway variables:set NODE_VERSION=18
railway variables:set NPM_VERSION=9
```

#### **Email Alerts Not Working**
```bash
# Test SMTP configuration
railway run node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
transporter.verify().then(console.log).catch(console.error);
"
```

#### **High Memory Usage**
```bash
# Optimize memory usage
railway variables:set NODE_OPTIONS="--max-old-space-size=512"

# Check metrics retention
railway variables:set METRICS_RETENTION_DAYS=30
```

---

## 📈 **Scaling Considerations**

### **Database Optimization**
```sql
-- Add indexes for better performance
CREATE INDEX idx_generation_logs_created_at ON generation_logs(created_at);
CREATE INDEX idx_system_health_service_status ON system_health(service, status);
CREATE INDEX idx_metrics_snapshot_timestamp ON metrics_snapshot(timestamp);
```

### **Memory Management**
```env
# Optimize for Railway's memory limits
NODE_OPTIONS="--max-old-space-size=512"
METRICS_CLEANUP_INTERVAL="3600000"  # 1 hour
ALERT_COOLDOWN_MINUTES="5"
```

### **Traffic Management**
```typescript
// Add rate limiting if needed
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
```

---

## 🔒 **Security Configuration**

### **Environment Security**
```bash
# Secure environment variables
railway variables:set DATABASE_SSL=true
railway variables:set FORCE_HTTPS=true

# API security
railway variables:set API_RATE_LIMIT=100
railway variables:set CORS_ORIGIN=https://copyflow.com
```

### **Access Control**
```typescript
// Add basic auth for production (optional)
const basicAuth = {
  users: { 'admin': process.env.DASHBOARD_PASSWORD },
  challenge: true
}
```

---

## 💰 **Cost Optimization**

### **Railway Pricing**
- **Starter Plan**: $5/month per service
- **Pro Plan**: $20/month per service
- **Database**: $5/month for PostgreSQL

### **Cost Optimization Tips**
1. **Use single service** for dashboard
2. **Optimize database queries** to reduce CPU usage
3. **Set reasonable retention periods** for metrics
4. **Use external monitoring** only if needed
5. **Monitor usage** in Railway dashboard

---

## 📋 **Production Checklist**

### **Before Go-Live**
- [ ] Database deployed and configured
- [ ] All environment variables set
- [ ] Health checks responding
- [ ] Alerts tested and working
- [ ] Custom domain configured (if using)
- [ ] SSL certificate active
- [ ] Main project integration tested
- [ ] Backup strategy defined

### **After Go-Live**
- [ ] Monitor logs for errors
- [ ] Verify alert delivery
- [ ] Check dashboard performance
- [ ] Test all API endpoints
- [ ] Monitor database usage
- [ ] Set up external monitoring (optional)

---

## 🎯 **Success Metrics**

Track these metrics to ensure successful deployment:

1. **Dashboard Uptime**: >99.9%
2. **Response Time**: <500ms for health checks
3. **Alert Delivery**: <30 seconds for critical alerts
4. **Database Performance**: <100ms query time
5. **Memory Usage**: <400MB average

---

**🎉 Your CopyFlow Health Dashboard is now ready for production!**

Dashboard URL: `https://your-dashboard.railway.app`
Health Check: `https://your-dashboard.railway.app/api/health`
