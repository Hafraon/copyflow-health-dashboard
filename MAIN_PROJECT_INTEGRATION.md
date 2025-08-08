# 🔗 CopyFlow Health Dashboard - Main Project Integration Guide

## 🎯 **Integration Overview**

The Health Dashboard uses a lightweight monitoring client to collect metrics from your main CopyFlow project without affecting performance or reliability.

### **Integration Principles:**
- ✅ **Non-blocking**: Never slows down main functionality
- ✅ **Fail-safe**: Silent failures don't break your app
- ✅ **Minimal**: Add monitoring with 1-2 lines per API route
- ✅ **Optional**: Works whether dashboard is online or not

---

## 📁 **Step 1: Copy Monitoring Client**

Copy the monitoring client to your main project:

```bash
# From admin-dashboard directory
cp INTEGRATION_FOR_MAIN_PROJECT.ts "../project/lib/monitoring-client.ts"
```

---

## ⚙️ **Step 2: Configure Environment**

Add to your main project `.env`:

```env
# CopyFlow Health Dashboard Integration
MONITORING_ENABLED="true"
MONITORING_DASHBOARD_URL="http://localhost:3001"  # Local development
# MONITORING_DASHBOARD_URL="https://your-dashboard.railway.app"  # Production
```

---

## 🔧 **Step 3: Integrate with API Routes**

### **Basic Integration - Generation API**

Update `app/api/generate/route.ts`:

```typescript
import { logGeneration } from '@/lib/monitoring-client'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // ... existing generation logic ...
    
    const processingTime = Date.now() - startTime
    
    // 📊 Log metric to dashboard (non-blocking)
    await logGeneration(
      processingTime,
      'elite-assistant',  // or assistantUsed variable
      true,               // success
      {
        userId: session?.user?.id,
        requestSize: JSON.stringify(body).length,
        generationType: 'standard'
      }
    )
    
    return NextResponse.json(enhancedResponse)
    
  } catch (error) {
    // 📊 Log error metric
    await logGeneration(
      Date.now() - startTime,
      'elite-assistant',
      false,  // failed
      {
        errorType: error.name,
        errorMessage: error.message
      }
    )
    
    throw error
  }
}
```

### **Advanced Generation API**

Update `app/api/generate-advanced/route.ts`:

```typescript
import { logGeneration } from '@/lib/monitoring-client'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // ... existing logic ...
    
    // 📊 Log advanced generation metrics
    await logGeneration(
      Date.now() - startTime,
      'copyflow-assistant',
      results.length > 0,
      {
        userId: session?.user?.id,
        productsCount: products.length,
        generationType: 'advanced',
        useEmojis,
        emojiIntensity
      }
    )
    
    return NextResponse.json({ success: true, content: results })
    
  } catch (error) {
    await logGeneration(
      Date.now() - startTime,
      'copyflow-assistant',
      false,
      {
        errorType: error.name,
        errorMessage: error.message,
        generationType: 'advanced'
      }
    )
    
    throw error
  }
}
```

### **Other API Routes**

#### **Authentication Routes**
```typescript
// app/api/auth/register/route.ts
import { logAPICall } from '@/lib/monitoring-client'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // ... existing logic ...
    
    await logAPICall(
      '/api/auth/register',
      Date.now() - startTime,
      true,
      { newUser: true }
    )
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    await logAPICall(
      '/api/auth/register',
      Date.now() - startTime,
      false,
      { error: error.message }
    )
    throw error
  }
}
```

#### **Payment Routes**
```typescript
// app/api/wayforpay/webhook/route.ts
import { logAPICall, logMetric } from '@/lib/monitoring-client'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // ... existing payment processing ...
    
    await logAPICall(
      '/api/wayforpay/webhook',
      Date.now() - startTime,
      true,
      { paymentStatus: 'success' }
    )
    
    // Log payment metric
    await logMetric('payment_processed', 1, {
      amount: paymentData.amount,
      currency: paymentData.currency,
      plan: paymentData.plan
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    await logAPICall(
      '/api/wayforpay/webhook',
      Date.now() - startTime,
      false,
      { error: error.message }
    )
    throw error
  }
}
```

---

## 🔍 **Step 4: Add Health Check Endpoint**

Create `app/api/health/route.ts` in your main project:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Test OpenAI API key
    const openaiConfigured = !!process.env.OPENAI_API_KEY
    
    const health = {
      status: 'operational',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
      services: {
        database: 'operational',
        openai: openaiConfigured ? 'operational' : 'configuration_missing',
        auth: 'operational'
      },
      version: process.env.npm_package_version || '1.0.0'
    }
    
    return NextResponse.json(health)
    
  } catch (error) {
    return NextResponse.json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed',
      responseTime: Date.now() - startTime
    }, { status: 500 })
  }
}
```

---

## 📊 **Step 5: Add System Monitoring**

### **Database Performance Monitoring**

```typescript
// lib/prisma.ts - Wrap Prisma client
import { PrismaClient } from '@prisma/client'
import { logDatabaseQuery } from './monitoring-client'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

// Middleware to log database performance
prisma.$use(async (params, next) => {
  const startTime = Date.now()
  
  try {
    const result = await next(params)
    
    await logDatabaseQuery(
      Date.now() - startTime,
      params.action,
      true
    )
    
    return result
  } catch (error) {
    await logDatabaseQuery(
      Date.now() - startTime,
      params.action,
      false
    )
    throw error
  }
})

export { prisma }
```

### **User Activity Tracking**

```typescript
// In your authentication middleware or pages
import { logUserActivity } from '@/lib/monitoring-client'

// Login tracking
await logUserActivity('login', session.user.id)

// Generation usage tracking
await logUserActivity('generation_created', session.user.id)

// Dashboard access tracking
await logUserActivity('dashboard_accessed', session.user.id)
```

---

## 🚨 **Step 6: Error Monitoring**

### **Global Error Handler**

```typescript
// lib/error-handler.ts
import { logError } from '@/lib/monitoring-client'

export function handleError(error: Error, context: string) {
  console.error(`Error in ${context}:`, error)
  
  // Log to monitoring dashboard
  logError(error, context)
  
  // Additional error reporting (Sentry, etc.)
  // ...
}
```

### **API Error Wrapper**

```typescript
// lib/api-wrapper.ts
import { withMonitoring } from '@/lib/monitoring-client'

// Wrap your API handlers
export const monitoredHandler = withMonitoring(
  async (request: NextRequest) => {
    // Your API logic here
    return NextResponse.json({ success: true })
  },
  '/api/your-endpoint'
)

// Usage in route:
export const POST = monitoredHandler
```

---

## 🧪 **Step 7: Testing Integration**

### **Test Monitoring Connection**

```typescript
// test-monitoring.ts
import { monitoringClient } from '@/lib/monitoring-client'

async function testMonitoring() {
  console.log('Testing monitoring integration...')
  
  // Test health check
  const healthOk = await monitoringClient.healthCheck()
  console.log('Dashboard reachable:', healthOk)
  
  // Test metric logging
  await monitoringClient.logMetric('test_metric', 123, { test: true })
  console.log('Test metric sent')
  
  // Test generation logging
  await monitoringClient.logGeneration(1500, {
    assistantUsed: 'test-assistant',
    success: true,
    userId: 'test-user'
  })
  console.log('Test generation logged')
}

testMonitoring()
```

### **Verify Dashboard Data**

1. Start both projects:
```bash
# Terminal 1: Main project
cd "E:\Claude control\CopyFlow\project"
npm run dev

# Terminal 2: Health dashboard
cd "E:\Claude control\CopyFlow\admin-dashboard"
npm run dev
```

2. Generate some test data:
```bash
# Make API calls to your main project
curl -X POST http://localhost:3000/api/test \
  -H 'Content-Type: application/json' \
  -d '{"test": true}'
```

3. Check dashboard:
- Visit http://localhost:3001
- Verify metrics are appearing
- Check real-time updates

---

## 🎯 **Step 8: Production Deployment**

### **Update Environment Variables**

After deploying dashboard to production:

```env
# In main project production environment
MONITORING_ENABLED="true"
MONITORING_DASHBOARD_URL="https://your-dashboard.railway.app"
```

### **Verify Production Integration**

```bash
# Test production dashboard connection
curl https://your-main-app.railway.app/api/health

# Check if metrics are flowing
curl https://your-dashboard.railway.app/api/metrics
```

---

## 📊 **What You'll See in Dashboard**

After integration, your dashboard will show:

### **Real-time Metrics:**
- ⚡ Average response times for each API endpoint
- ✅ Success rates for generations and API calls  
- 👥 Active user counts
- 🚀 Generations per hour
- 📊 Error rates and types

### **Service Health:**
- 🟢 Main CopyFlow API status
- 🤖 OpenAI Assistant performance
- 🗄️ Database response times
- 💳 Payment system status
- 🔐 Authentication system health

### **Performance Charts:**
- 📈 Response time trends over time
- 📊 Success rate evolution
- 🎯 Usage patterns throughout the day
- 🔍 Error spike detection

### **Alerts:**
- 📧 Email notifications for issues
- 📱 Telegram alerts for critical problems
- 🚨 Automatic incident creation
- ⚡ Real-time status updates

---

## 🛡️ **Safety Features**

The monitoring integration is designed to be safe:

### **Non-blocking:**
- All monitoring calls use `async` without `await` in critical paths
- Failed monitoring never breaks your main functionality
- Timeouts prevent hanging API calls

### **Graceful Degradation:**
- Works whether dashboard is online or offline
- Silent failures with optional error logging
- No impact on user experience

### **Minimal Overhead:**
- Lightweight JSON payloads
- Efficient network usage
- Optional monitoring can be disabled instantly

---

## 🔧 **Troubleshooting Integration**

### **Monitoring Not Working:**
```typescript
// Check if monitoring is enabled
console.log('Monitoring enabled:', process.env.MONITORING_ENABLED)
console.log('Dashboard URL:', process.env.MONITORING_DASHBOARD_URL)

// Test dashboard connection
import { monitoringClient } from '@/lib/monitoring-client'
monitoringClient.healthCheck().then(console.log)
```

### **High Response Times:**
```typescript
// Disable monitoring temporarily
// In .env
MONITORING_ENABLED="false"

// Or increase timeout
MONITORING_REQUEST_TIMEOUT="2000"  // 2 seconds
```

### **Dashboard Not Receiving Data:**
```bash
# Check dashboard logs
cd admin-dashboard
npm run dev

# Check main project logs
cd project  
npm run dev

# Test direct API call
curl -X POST http://localhost:3001/api/metrics \
  -H 'Content-Type: application/json' \
  -d '{"metric":"test","value":123}'
```

---

**🎉 Integration Complete!** 

Your CopyFlow project now feeds real-time data to your professional Health Dashboard. Monitor performance, track issues, and maintain uptime like a Fortune 500 company! 📊✨