# 🚀 CopyFlow Health Dashboard - Railway Deployment

## ⚡ **Automated Deployment (Recommended)**

### **One-Click Deploy:**
```bash
deploy-railway.bat
```
This script will:
- ✅ Install Railway CLI (if needed)
- ✅ Login to Railway
- ✅ Create new project
- ✅ Add PostgreSQL database
- ✅ Set environment variables
- ✅ Deploy application
- ✅ Setup database

---

## 🔧 **Manual Deployment Steps**

### **1. Install Railway CLI**
```bash
npm install -g @railway/cli
railway login
```

### **2. Create Project**
```bash
# In admin-dashboard directory
railway init
# Choose: "Create new project"
# Project name: "copyflow-health-dashboard"
```

### **3. Add Database**
```bash
railway add postgresql
```

### **4. Set Environment Variables**
```bash
# Basic configuration
railway variables:set NODE_ENV=production
railway variables:set MONITORING_ENABLED=true

# Dashboard settings
railway variables:set DASHBOARD_REFRESH_INTERVAL=30000
railway variables:set HEALTH_CHECK_INTERVAL=60000

# Alert thresholds
railway variables:set RESPONSE_TIME_WARNING=2000
railway variables:set RESPONSE_TIME_CRITICAL=5000
railway variables:set SUCCESS_RATE_WARNING=95
railway variables:set SUCCESS_RATE_CRITICAL=90

# OpenAI (add your keys)
railway variables:set OPENAI_API_KEY=your-api-key
railway variables:set OPENAI_ASSISTANT_ELITE=your-assistant-id

# Main project URL (update after deploying main project)
railway variables:set MAIN_PROJECT_API_URL=https://your-main-project.railway.app
```

### **5. Deploy**
```bash
railway up
```

### **6. Setup Database**
```bash
railway run npx prisma db push
```

---

## 🎯 **Post-Deployment**

### **Check Deployment:**
```bash
railway status
railway logs
railway open  # Opens dashboard in browser
```

### **Your Dashboard URL:**
Your dashboard will be available at: `https://copyflow-health-dashboard-production.up.railway.app`

### **Health Check:**
Test: `https://your-dashboard.railway.app/api/health`

---

## ⚙️ **Optional Configuration**

### **Email Alerts:**
```bash
railway variables:set SMTP_HOST=smtp.gmail.com
railway variables:set SMTP_PORT=587
railway variables:set SMTP_USER=your-email@gmail.com
railway variables:set SMTP_PASS=your-gmail-app-password
railway variables:set ALERT_EMAIL_TO=admin@copyflow.com
```

### **Telegram Alerts:**
```bash
railway variables:set TELEGRAM_BOT_TOKEN=your-bot-token
railway variables:set TELEGRAM_CHAT_ID=your-chat-id
```

---

## 🔧 **Troubleshooting**

### **Deployment Failed:**
```bash
railway logs  # Check error logs
railway status  # Check service status
```

### **Database Issues:**
```bash
railway run npx prisma db push --force-reset  # Reset database
railway run npx prisma studio  # Open database viewer
```

### **Environment Variables:**
```bash
railway variables  # View all variables
railway variables:set KEY=value  # Set variable
railway variables:delete KEY  # Delete variable
```

---

## 📊 **Success Verification**

After deployment, verify:
- [ ] Dashboard loads at Railway URL
- [ ] Health API responds: `/api/health`
- [ ] Database connection works
- [ ] Metrics API responds: `/api/metrics`
- [ ] No errors in `railway logs`

---

**🎉 Your professional health dashboard is now live on Railway!**

Next: Configure alerts and integrate with your main CopyFlow project.
