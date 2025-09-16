# 🚨 CopyFlow Health Dashboard - Alert Configuration Examples

## 📊 **Threshold Configuration**

### **Response Time Alerts**
```env
# Warning: 2 seconds (user experience starts degrading)
RESPONSE_TIME_WARNING="2000"

# Critical: 5 seconds (users likely to abandon)
RESPONSE_TIME_CRITICAL="5000"
```

### **Success Rate Alerts**
```env
# Warning: 95% (5% error rate concerning)
SUCCESS_RATE_WARNING="95"

# Critical: 90% (10% error rate requires immediate action)
SUCCESS_RATE_CRITICAL="90"
```

### **Error Rate Alerts**
```env
# Warning: 5% error rate
ERROR_RATE_WARNING="5"

# Critical: 10% error rate
ERROR_RATE_CRITICAL="10"
```

---

## 📧 **Email Alert Examples**

### **Gmail SMTP Configuration**
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="alerts@yourcompany.com"
SMTP_PASS="your-gmail-app-password"
ALERT_EMAIL_FROM="CopyFlow Alerts <alerts@yourcompany.com>"
ALERT_EMAIL_TO="admin@yourcompany.com,support@yourcompany.com"
```

**Setup Gmail App Password:**
1. Go to Google Account settings
2. Security → 2-Step Verification (enable if not enabled)
3. App passwords → Generate password for "CopyFlow Alerts"
4. Use generated password in `SMTP_PASS`

### **Custom SMTP (e.g., SendGrid, Mailgun)**
```env
# SendGrid
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"

# Mailgun
SMTP_HOST="smtp.mailgun.org"
SMTP_PORT="587"
SMTP_USER="postmaster@your-domain.mailgun.org"
SMTP_PASS="your-mailgun-password"
```

---

## 📱 **Telegram Bot Setup**

### **Step 1: Create Bot**
1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot`
3. Choose bot name: "CopyFlow Health Bot"
4. Choose username: "copyflow_health_bot"
5. Save the bot token

### **Step 2: Get Chat ID**
```bash
# Method 1: Use @userinfobot
# Add @userinfobot to your chat, it will show chat ID

# Method 2: Send message to your bot, then check:
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates"
```

### **Step 3: Configure Environment**
```env
TELEGRAM_BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
TELEGRAM_CHAT_ID="123456789"  # Your personal chat ID
# TELEGRAM_CHAT_ID="-1001234567890"  # Group chat ID (starts with -100)
```

---

## 🎯 **Production Thresholds**

### **Conservative (High Reliability)**
```env
# Very sensitive to performance degradation
RESPONSE_TIME_WARNING="1500"   # 1.5 seconds
RESPONSE_TIME_CRITICAL="3000"  # 3 seconds
SUCCESS_RATE_WARNING="98"      # 98%
SUCCESS_RATE_CRITICAL="95"     # 95%
ERROR_RATE_WARNING="2"         # 2%
ERROR_RATE_CRITICAL="5"        # 5%
```

### **Balanced (Standard SaaS)**
```env
# Good balance between reliability and alert fatigue
RESPONSE_TIME_WARNING="2000"   # 2 seconds
RESPONSE_TIME_CRITICAL="5000"  # 5 seconds
SUCCESS_RATE_WARNING="95"      # 95%
SUCCESS_RATE_CRITICAL="90"     # 90%
ERROR_RATE_WARNING="5"         # 5%
ERROR_RATE_CRITICAL="10"       # 10%
```

### **Relaxed (High Volume)**
```env
# More tolerant for high-volume systems
RESPONSE_TIME_WARNING="3000"   # 3 seconds
RESPONSE_TIME_CRITICAL="8000"  # 8 seconds
SUCCESS_RATE_WARNING="90"      # 90%
SUCCESS_RATE_CRITICAL="85"     # 85%
ERROR_RATE_WARNING="10"        # 10%
ERROR_RATE_CRITICAL="15"       # 15%
```

---

## 🔔 **Alert Channel Configuration**

### **Email Only**
```typescript
// In your custom alerts
await alertService.sendAlert({
  title: 'High Response Time',
  message: 'Response time exceeded threshold',
  severity: 'warning',
  service: 'api',
  channels: ['email']  // Only email
})
```

### **Telegram Only**
```typescript
await alertService.sendAlert({
  title: 'Service Down',
  message: 'API is not responding',
  severity: 'critical',
  service: 'api',
  channels: ['telegram']  // Only Telegram
})
```

### **Both Channels**
```typescript
await alertService.sendAlert({
  title: 'Critical Issue',
  message: 'Multiple services affected',
  severity: 'critical',
  service: 'system',
  channels: ['email', 'telegram']  // Both
})
```

---

## ⚙️ **Production Environment Setup**

### **Railway Production**
```env
NODE_ENV="production"
PORT="3001"

# Production Database (Supabase/Railway PostgreSQL)
MONITORING_DATABASE_URL="${DATABASE_URL}"

# Production URLs
MAIN_PROJECT_API_URL="https://copyflow.railway.app"
DASHBOARD_REFRESH_INTERVAL="30000"
HEALTH_CHECK_INTERVAL="60000"

# Production Alerts
ALERT_EMAIL_FROM="alerts@copyflow.com"
ALERT_EMAIL_TO="team@copyflow.com"

# Retention
METRICS_RETENTION_DAYS="90"
LOG_LEVEL="warn"
```

### **Vercel/Netlify**
```env
NODE_ENV="production"

# Use Supabase for database
MONITORING_DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"

# Production API
MAIN_PROJECT_API_URL="https://copyflow.vercel.app"

# Enable monitoring
MONITORING_ENABLED="true"
```

---

## 📊 **Custom Alert Rules**

### **Business Hours vs Off-Hours**
```typescript
// Business hours: stricter thresholds
const isBusinessHours = () => {
  const hour = new Date().getHours()
  return hour >= 9 && hour <= 17
}

const thresholds = isBusinessHours() 
  ? { warning: 1500, critical: 3000 }  // Stricter during business
  : { warning: 3000, critical: 6000 }  // Relaxed off-hours
```

### **Escalation Rules**
```typescript
// Alert escalation based on duration
const alertRules = {
  warning: {
    immediate: ['telegram'],
    after5min: ['email'],
    after15min: ['email', 'telegram']
  },
  critical: {
    immediate: ['email', 'telegram'],
    after5min: ['email', 'telegram'],  // Re-alert
    after15min: ['phone']  // Escalate to phone
  }
}
```

---

## 🧪 **Testing Alert Configuration**

### **Test Script**
```bash
# Test email alerts
node -e "
const { emailAlertService } = require('./lib/alerts/email');
emailAlertService.testConnection().then(console.log);
"

# Test Telegram alerts  
node -e "
const { telegramAlertService } = require('./lib/alerts/telegram');
telegramAlertService.testConnection().then(console.log);
"

# Send test alert to both channels
node -e "
const { alertService } = require('./lib/alerts');
alertService.sendAlert({
  title: 'Test Alert',
  message: 'Testing alert system configuration',
  severity: 'info',
  service: 'dashboard'
}).then(console.log);
"
```

### **Load Testing Alerts**
```bash
# Simulate high response time
curl -X POST http://localhost:3001/api/metrics \
  -H 'Content-Type: application/json' \
  -d '{"metric":"generation_time","value":6000,"metadata":{"test":true}}'

# Simulate errors
curl -X POST http://localhost:3001/api/metrics \
  -H 'Content-Type: application/json' \
  -d '{"metric":"error_count","value":1,"metadata":{"success":false,"test":true}}'
```

---

## 📱 **Mobile-Friendly Telegram Commands**

Set up bot commands for mobile monitoring:

```typescript
// In telegram.ts, add these commands:
const commands = [
  { command: 'status', description: 'Get current system status' },
  { command: 'health', description: 'Check system health' },
  { command: 'metrics', description: 'View key metrics' },
  { command: 'alerts', description: 'List active alerts' },
  { command: 'mute', description: 'Mute alerts for 1 hour' },
  { command: 'unmute', description: 'Unmute alerts' }
]
```

---

## 🚨 **Alert Fatigue Prevention**

### **Smart Cooldowns**
```env
# Don't re-alert for same issue within this time
ALERT_COOLDOWN_MINUTES="5"

# Group related alerts together
ALERT_GROUPING_WINDOW="60"  # seconds

# Escalation timing
ESCALATION_FIRST="300"   # 5 minutes
ESCALATION_SECOND="900"  # 15 minutes
```

### **Alert Suppression**
```typescript
// Suppress alerts during maintenance
const maintenanceMode = {
  enabled: false,
  start: new Date('2025-08-10T02:00:00Z'),
  end: new Date('2025-08-10T04:00:00Z'),
  reason: 'Scheduled database maintenance'
}
```

---

**💡 Pro Tip:** Start with balanced thresholds and adjust based on your actual usage patterns after 1-2 weeks of monitoring data.
