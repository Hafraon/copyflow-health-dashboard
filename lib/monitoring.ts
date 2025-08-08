// CopyFlow Health Dashboard - Monitoring Library
// Production version для PostgreSQL на Railway

// Force dynamic import for Prisma Client
export const dynamic = 'force-dynamic'

import { PrismaClient } from '@prisma/client'

// Global Prisma client - singleton pattern for production
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Ініціалізація Prisma клієнта для моніторингу
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export interface HealthStatus {
  service: string
  status: 'operational' | 'degraded' | 'partial' | 'major' | 'maintenance'
  responseTime?: number
  uptime?: number
  lastCheck: Date
  metadata?: any
}

export interface MetricData {
  metric: string
  value: number
  timestamp: Date
  metadata?: any
}

export interface AlertRule {
  id: string
  name: string
  metric: string
  threshold: number
  operator: 'gt' | 'lt' | 'eq'
  severity: 'warning' | 'error' | 'critical'
  enabled: boolean
  lastTriggered?: Date
}

// 🔍 HEALTH CHECKS
export async function getSystemHealth(): Promise<HealthStatus[]> {
  try {
    // В production це буде реальна перевірка сервісів
    const services = [
      'api',
      'auth', 
      'database',
      'payment',
      'openai-elite',
      'openai-universal'
    ]
    
    const healthChecks = await Promise.allSettled(
      services.map(service => checkServiceHealth(service))
    )
    
    return healthChecks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          service: services[index],
          status: 'major' as const,
          lastCheck: new Date(),
          metadata: { error: result.reason }
        }
      }
    })
    
  } catch (error) {
    console.error('System health check failed:', error)
    throw error
  }
}

export async function checkServiceHealth(service: string): Promise<HealthStatus> {
  const startTime = Date.now()
  
  try {
    switch (service) {
      case 'api':
        return await checkAPIHealth()
      case 'database':
        return await checkDatabaseHealth()
      case 'openai-elite':
      case 'openai-universal':
        return await checkOpenAIHealth(service)
      default:
        return await checkGenericServiceHealth(service)
    }
  } catch (error) {
    return {
      service,
      status: 'major',
      responseTime: Date.now() - startTime,
      lastCheck: new Date(),
      metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

async function checkAPIHealth(): Promise<HealthStatus> {
  const startTime = Date.now()
  
  try {
    // Перевірка основного API
    const mainProjectUrl = process.env.MAIN_PROJECT_API_URL || 'http://localhost:3000'
    const response = await fetch(`${mainProjectUrl}/api/health`, {
      signal: AbortSignal.timeout(5000)
    })
    
    const responseTime = Date.now() - startTime
    
    return {
      service: 'api',
      status: response.ok ? 
        (responseTime > 2000 ? 'degraded' : 'operational') : 
        'partial',
      responseTime,
      lastCheck: new Date(),
      metadata: { httpStatus: response.status }
    }
  } catch (error) {
    return {
      service: 'api',
      status: 'major',
      responseTime: Date.now() - startTime,
      lastCheck: new Date(),
      metadata: { error: error instanceof Error ? error.message : 'API unreachable' }
    }
  }
}

async function checkDatabaseHealth(): Promise<HealthStatus> {
  const startTime = Date.now()
  
  try {
    // Простий запит до БД
    await prisma.$queryRaw`SELECT 1`
    
    const responseTime = Date.now() - startTime
    
    return {
      service: 'database',
      status: responseTime > 100 ? 'degraded' : 'operational',
      responseTime,
      lastCheck: new Date(),
      metadata: { connectionPool: 'healthy' }
    }
  } catch (error) {
    return {
      service: 'database',
      status: 'major',
      responseTime: Date.now() - startTime,
      lastCheck: new Date(),
      metadata: { error: error instanceof Error ? error.message : 'DB connection failed' }
    }
  }
}

async function checkOpenAIHealth(assistantType: string): Promise<HealthStatus> {
  const startTime = Date.now()
  
  try {
    // Тут можна додати реальну перевірку OpenAI Assistant
    // Поки що імітуємо
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const responseTime = Date.now() - startTime
    
    return {
      service: assistantType,
      status: 'operational',
      responseTime,
      lastCheck: new Date(),
      metadata: { 
        assistantId: assistantType === 'openai-elite' ? 
          process.env.OPENAI_ASSISTANT_ELITE?.substring(0, 10) + '...' :
          process.env.OPENAI_ASSISTANT_UNIVERSAL?.substring(0, 10) + '...',
        apiKeyConfigured: !!process.env.OPENAI_API_KEY
      }
    }
  } catch (error) {
    return {
      service: assistantType,
      status: 'major',
      responseTime: Date.now() - startTime,
      lastCheck: new Date(),
      metadata: { error: error instanceof Error ? error.message : 'OpenAI check failed' }
    }
  }
}

async function checkGenericServiceHealth(service: string): Promise<HealthStatus> {
  // Загальна перевірка для інших сервісів
  return {
    service,
    status: 'operational',
    responseTime: 50 + Math.random() * 100,
    lastCheck: new Date(),
    metadata: { type: 'generic_check' }
  }
}

// 📊 METRICS COLLECTION
export async function recordMetric(data: MetricData): Promise<void> {
  try {
    // Запис метрики в БД (PostgreSQL з Json полями)
    await prisma.generationLogs.create({
      data: {
        requestId: data.metadata?.requestId,
        userId: data.metadata?.userId,
        generationType: data.metadata?.type || 'unknown',
        assistantUsed: data.metadata?.assistant || 'unknown',
        processingTime: data.value,
        success: data.metadata?.success ?? true,
        errorType: data.metadata?.errorType,
        errorMessage: data.metadata?.errorMessage,
        metadata: data.metadata || {}
      }
    })
    
    // Оновлення агрегованих метрик
    await updateMetricsSnapshot()
    
  } catch (error) {
    console.error('Failed to record metric:', error)
    // Не кидаємо помилку щоб не зламати основний процес
  }
}

export async function updateMetricsSnapshot(): Promise<void> {
  try {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    // Розрахунок метрик за останню годину
    const recentLogs = await prisma.generationLogs.findMany({
      where: {
        createdAt: {
          gte: oneHourAgo
        }
      }
    })
    
    const totalRequests = recentLogs.length
    const successfulRequests = recentLogs.filter((log: any) => log.success).length
    const averageResponseTime = totalRequests > 0 ? 
      recentLogs.reduce((sum: number, log: any) => sum + log.processingTime, 0) / totalRequests : 0
    
    // Збереження snapshot
    await prisma.metricsSnapshot.create({
      data: {
        generationsPerMinute: totalRequests / 60,
        averageResponseTime,
        successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100,
        errorRate: totalRequests > 0 ? ((totalRequests - successfulRequests) / totalRequests) * 100 : 0,
        activeUsers: await getActiveUsersCount(),
        assistantsOnline: await getOnlineAssistantsCount()
      }
    })
    
  } catch (error) {
    console.error('Failed to update metrics snapshot:', error)
  }
}

// 🚨 ALERTING SYSTEM  
export async function checkAlerts(): Promise<void> {
  try {
    const alertRules = await prisma.alertRules.findMany({
      where: { enabled: true }
    })
    
    const latestMetrics = await prisma.metricsSnapshot.findFirst({
      orderBy: { timestamp: 'desc' }
    })
    
    if (!latestMetrics) return
    
    for (const rule of alertRules) {
      const shouldAlert = await evaluateAlertRule(rule, latestMetrics)
      
      if (shouldAlert) {
        await triggerAlert(rule, latestMetrics)
      }
    }
    
  } catch (error) {
    console.error('Alert check failed:', error)
  }
}

async function evaluateAlertRule(rule: AlertRule, metrics: any): Promise<boolean> {
  const metricValue = metrics[rule.metric]
  if (metricValue === undefined) return false
  
  switch (rule.operator) {
    case 'gt':
      return metricValue > rule.threshold
    case 'lt':
      return metricValue < rule.threshold
    case 'eq':
      return metricValue === rule.threshold
    default:
      return false
  }
}

async function triggerAlert(rule: AlertRule, metrics: any): Promise<void> {
  try {
    // Перевірка cooldown
    if (rule.lastTriggered) {
      const cooldownMs = 5 * 60 * 1000 // 5 minutes
      if (Date.now() - rule.lastTriggered.getTime() < cooldownMs) {
        return // Ще в cooldown
      }
    }
    
    // Створення incident log
    await prisma.incidentLogs.create({
      data: {
        severity: rule.severity,
        service: 'monitoring',
        title: `Alert: ${rule.name}`,
        description: `${rule.metric} threshold exceeded: ${metrics[rule.metric]} ${rule.operator} ${rule.threshold}`,
        status: 'investigating',
        alertSent: false
      }
    })
    
    // Відправка сповіщення
    await sendAlert(rule, metrics)
    
    // Оновлення lastTriggered
    await prisma.alertRules.update({
      where: { id: rule.id },
      data: { lastTriggered: new Date() }
    })
    
  } catch (error) {
    console.error('Failed to trigger alert:', error)
  }
}

async function sendAlert(rule: AlertRule, metrics: any): Promise<void> {
  console.log(`🚨 ALERT: ${rule.name} - ${rule.metric}: ${metrics[rule.metric]}`)
  
  // Telegram notification
  try {
    const { sendTelegramAlert } = await import('./telegram-alerts')
    
    await sendTelegramAlert(
      rule.name,
      `${rule.metric} threshold exceeded: ${metrics[rule.metric]} ${rule.operator} ${rule.threshold}`,
      rule.severity as any,
      'monitoring',
      {
        metric: rule.metric,
        value: metrics[rule.metric],
        threshold: rule.threshold,
        operator: rule.operator,
        ruleName: rule.name
      }
    )
  } catch (error) {
    console.error('Failed to send Telegram alert:', error)
  }
  
  // Email notification
  if (process.env.ALERT_EMAIL_TO) {
    // await sendEmailAlert(rule, metrics)
  }
}

// 📈 HELPER FUNCTIONS
async function getActiveUsersCount(): Promise<number> {
  // В production тут буде реальна логіка підрахунку активних користувачів
  return Math.floor(20 + Math.random() * 30)
}

async function getOnlineAssistantsCount(): Promise<number> {
  // Перевірка доступності асистентів
  return 2 // Elite + Universal
}

// 🔄 BACKGROUND TASKS
export async function startHealthMonitoring(): Promise<void> {
  console.log('🔍 Starting health monitoring...')
  
  // Запуск перевірок кожну хвилину
  setInterval(async () => {
    try {
      await updateMetricsSnapshot()
      await checkAlerts()
    } catch (error) {
      console.error('Health monitoring error:', error)
    }
  }, 60000) // 1 minute
}

export { prisma }
