# 🎯 CopyFlow Health Dashboard

> **Real-time system health monitoring for CopyFlow** - Anthropic-style status page with comprehensive performance tracking and alerting.

## 🌟 Features

### 📊 **Comprehensive Monitoring**
- ✅ Real-time system health checks
- ⚡ Performance metrics tracking  
- 🤖 OpenAI Assistant status monitoring
- 📈 Historical performance trends
- 🚨 Intelligent alerting system

### 🎨 **Professional UI**
- 🖥️ Anthropic-inspired design
- 📱 Responsive dashboard
- 🔄 Live data updates (30-second refresh)
- 📊 Interactive performance charts
- 🎯 Color-coded status indicators

### 🚨 **Multi-Channel Alerts**
- 📧 Email notifications with HTML templates
- 📱 Telegram bot integration
- ⚙️ Configurable thresholds
- 🔄 Smart cooldown periods
- 📊 Incident tracking

---

## 🚀 Quick Start

### **1. Install Dependencies**
```bash
cd E:\Claude control\CopyFlow\admin-dashboard
npm install
```

### **2. Database Setup**
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Open Prisma Studio (optional)
npm run db:studio
```

### **3. Environment Configuration**
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
```

### **4. Start Dashboard**
```bash
# Development mode
npm run dev

# Production mode
npm run build && npm start
```

📍 **Dashboard URL:** http://localhost:3001

---

## ⚙️ Configuration

### **🗄️ Database Setup**

#### **Option 1: Local PostgreSQL**
```env
MONITORING_DATABASE_URL="postgresql://username:password@localhost:5432/copyflow_monitoring"
```

#### **Option 2: Supabase**
```env
MONITORING_DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"
```

### **🔗 Main Project Integration**
```env
MAIN_PROJECT_API_URL="http://localhost:3000"
MAIN_PROJECT_HEALTH_ENDPOINT="/api/health"
```

### **📧 Email Alerts Configuration**
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"  # Gmail App Password
ALERT_EMAIL_FROM="alerts@copyflow.com.ua"
ALERT_EMAIL_TO="admin@copyflow.com.ua"
```

**📝 Gmail Setup:**
1. Enable 2-factor authentication
2. Generate App Password in Google Account settings
3. Use App Password in `SMTP_PASS`

### **📱 Telegram Alerts Configuration**
```env
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"
```

**📝 Telegram Setup:**
1. Create bot via [@BotFather](https://t.me/BotFather)
2. Get bot token
3. Add bot to your chat/channel
4. Get chat ID using [@userinfobot](https://t.me/userinfobot)

### **🚨 Alert Thresholds**
```env
RESPONSE_TIME_WARNING="2000"    # 2 seconds
RESPONSE_TIME_CRITICAL="5000"   # 5 seconds
SUCCESS_RATE_WARNING="95"       # 95%
SUCCESS_RATE_CRITICAL="90"      # 90%
ERROR_RATE_WARNING="5"          # 5%
ERROR_RATE_CRITICAL="10"        # 10%
```

---

## 📊 Monitoring Integration

### **1. Add Monitoring to Main Project**

Add to your main CopyFlow project (`E:\Claude control\CopyFlow\project`):

**Create:** `lib/monitoring-client.ts`
```typescript
// Minimal monitoring client for main project
export async function logMetric(metric: string, value: number, metadata?: any) {
  if (process.env.MONITORING_ENABLED !== 'true') return
  
  try {
    await fetch('http://localhost:3001/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric,
        value,
        timestamp: new Date().toISOString(),
        metadata
      })
    })
  } catch (error) {
    // Silent fail - don't break main functionality
    console.warn('Monitoring metric failed:', error)
  }
}
```

**Update:** `app/api/generate/route.ts`
```typescript
import { logMetric } from '@/lib/monitoring-client'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // ... existing generation logic ...
    
    const processingTime = Date.now() - startTime
    
    // Log metric to monitoring dashboard
    await logMetric('generation_time', processingTime, {
      assistantUsed: 'elite',
      success: true,
      userId: session?.user?.id,
      requestSize: JSON.stringify(body).length
    })
    
    return NextResponse.json(enhancedResponse)
    
  } catch (error) {
    // Log error metric
    await logMetric('generation_error', Date.now() - startTime, {
      error: error.message,
      success: false
    })
    
    throw error
  }
}
```

### **2. Environment Variables for Main Project**
Add to main project `.env`:
```env
MONITORING_ENABLED="true"
MONITORING_DASHBOARD_URL="http://localhost:3001"
```

---

## 🎯 Dashboard Features

### **📊 System Status Overview**
- 🟢 **Operational**: All systems running normally
- 🟡 **Degraded**: Some performance issues
- 🟠 **Partial Outage**: Some features unavailable  
- 🔴 **Major Outage**: Critical systems down
- 🔵 **Maintenance**: Planned maintenance

### **⚡ Real-time Metrics**
- Response time tracking
- Success rate monitoring  
- Active user count
- Generations per hour
- Assistant uptime
- Error rate analysis

### **📈 Performance Charts**
- Response time trends
- Success rate over time
- Historical comparisons
- Peak usage analytics

### **🚨 Incident Management**
- Automatic incident creation
- Status page updates
- Resolution tracking
- Post-mortem reports

---

## 🚀 Deployment

### **Railway Deployment**

**1. Create Railway Project**
```bash
railway login
railway init
railway add postgresql
```

**2. Configure Environment**
```bash
railway variables:set NODE_ENV=production
railway variables:set PORT=3001
railway variables:set MONITORING_DATABASE_URL=${{PostgreSQL.DATABASE_URL}}
# Add other environment variables...
```

**3. Deploy**
```bash
railway up
```

### **Custom Domain Setup**
1. Configure custom domain in Railway dashboard
2. Update environment variables with production URLs
3. Update CORS settings if needed

---

## 🔧 API Endpoints

### **Health Check**
```
GET /api/health
```
Returns current system health status

### **Metrics**
```
GET /api/metrics?timeframe=1h&metric=responseTime
POST /api/metrics
```
Retrieve and submit performance metrics

### **System Status**
```
GET /api/status
```
Overall system status summary

---

## 🧪 Testing

### **Test Alert Channels**
```bash
# In dashboard directory
node -e "
const { alertService } = require('./lib/alerts');
alertService.testAllChannels().then(console.log);
"
```

### **Test Monitoring Integration**
```bash
# Test metric submission
curl -X POST http://localhost:3001/api/metrics \
  -H 'Content-Type: application/json' \
  -d '{"metric":"test","value":123,"metadata":{"test":true}}'
```

### **Health Check Test**
```bash
curl http://localhost:3001/api/health
```

---

## 📚 Monitoring Best Practices

### **🎯 Metric Collection**
- ✅ Log all critical operations
- ✅ Include response times
- ✅ Track success/failure rates
- ✅ Monitor resource usage
- ✅ Add contextual metadata

### **🚨 Alert Strategy**
- ⚠️ **Warning**: Early indicators (95% success rate)
- 🚨 **Critical**: User-impacting issues (90% success rate)
- 📊 **Info**: Status changes and maintenance
- 🔄 **Cooldown**: Prevent alert spam (5-minute intervals)

### **📊 Dashboard Usage**
- 👀 Monitor daily for trends
- 🔍 Investigate warnings early
- 📈 Review weekly performance reports
- 🎯 Adjust thresholds based on patterns

---

## 🛠️ Troubleshooting

### **Common Issues**

#### **Dashboard not loading**
```bash
# Check if service is running
curl http://localhost:3001/api/health

# Check logs
npm run dev

# Verify database connection
npm run db:studio
```

#### **Alerts not sending**
```bash
# Test email configuration
node -e "
const { emailAlertService } = require('./lib/alerts/email');
emailAlertService.testConnection().then(console.log);
"

# Test Telegram configuration  
node -e "
const { telegramAlertService } = require('./lib/alerts/telegram');
telegramAlertService.testConnection().then(console.log);
"
```

#### **Metrics not updating**
- Verify main project integration
- Check network connectivity
- Review API logs
- Validate environment variables

### **Database Issues**
```bash
# Reset database
npx prisma db push --force-reset

# View current data
npm run db:studio

# Check connection
npx prisma db pull
```

---

## 📞 Support

### **Documentation**
- 📖 [Prisma Documentation](https://prisma.io/docs)
- 📧 [Nodemailer Guide](https://nodemailer.com/)
- 🤖 [Telegram Bot API](https://core.telegram.org/bots/api)

### **Contact**
- 📧 **Email**: admin@copyflow.com.ua
- 💬 **Telegram**: Configure bot for direct support
- 🔧 **Issues**: Create incidents in dashboard

---

## 🎯 Future Enhancements

### **Phase 2 Features**
- 📱 Mobile app notifications
- 🔄 Auto-scaling triggers
- 📊 Advanced analytics
- 🤖 AI-powered anomaly detection
- 📈 Predictive monitoring

### **Integration Options**
- 🔔 Slack notifications
- 📞 PagerDuty integration  
- 📊 Datadog compatibility
- 🎯 Custom webhooks

---

**🎉 Dashboard готовий! Професійний моніторинг як у великих компаній!** 

*Created with ❤️ for CopyFlow team*
