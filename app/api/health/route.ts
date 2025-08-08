import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' // Уникнення static generation для API routes

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Здоров'я самого dashboard
    const health = {
      status: 'operational',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      responseTime: 0, // Буде заповнено нижче
      services: {
        dashboard: {
          status: 'operational',
          responseTime: 0,
          lastCheck: new Date().toISOString()
        },
        database: await checkDatabase(),
        mainProject: await checkMainProject(),
        openai: await checkOpenAI(),
        external: await checkExternalServices()
      },
      metrics: {
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    }
    
    const responseTime = Date.now() - startTime
    health.responseTime = responseTime
    health.services.dashboard.responseTime = responseTime
    
    // Визначення загального статусу
    const allStatuses = Object.values(health.services).map(s => s.status)
    const hasFailures = allStatuses.includes('major') || allStatuses.includes('offline')
    const hasDegradation = allStatuses.includes('degraded') || allStatuses.includes('partial')
    
    if (hasFailures) {
      health.status = 'major'
    } else if (hasDegradation) {
      health.status = 'degraded'
    } else {
      health.status = 'operational'
    }
    
    return NextResponse.json(health, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'major',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function checkDatabase() {
  try {
    // В production тут буде реальна перевірка БД
    const startTime = Date.now()
    
    // Імітація перевірки БД
    await new Promise(resolve => setTimeout(resolve, 10))
    
    return {
      status: 'operational',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      connections: 15,
      maxConnections: 100
    }
  } catch (error) {
    return {
      status: 'major',
      responseTime: 0,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Database check failed'
    }
  }
}

async function checkMainProject() {
  try {
    const startTime = Date.now()
    const mainProjectUrl = process.env.MAIN_PROJECT_API_URL || 'http://localhost:3000'
    
    // Перевірка основного проекту
    const response = await fetch(`${mainProjectUrl}/api/test`, {
      method: 'GET',
      headers: { 'User-Agent': 'CopyFlow-Health-Dashboard/1.0' },
      signal: AbortSignal.timeout(5000) // 5 секунд timeout
    })
    
    const responseTime = Date.now() - startTime
    
    if (response.ok) {
      return {
        status: responseTime > 2000 ? 'degraded' : 'operational',
        responseTime,
        lastCheck: new Date().toISOString(),
        httpStatus: response.status
      }
    } else {
      return {
        status: 'partial',
        responseTime,
        lastCheck: new Date().toISOString(),
        httpStatus: response.status,
        error: `HTTP ${response.status}`
      }
    }
  } catch (error) {
    return {
      status: 'major',
      responseTime: 0,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Main project unreachable'
    }
  }
}

async function checkOpenAI() {
  try {
    const startTime = Date.now()
    
    // Простий health check до OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return {
        status: 'major',
        responseTime: 0,
        lastCheck: new Date().toISOString(),
        error: 'OpenAI API key not configured'
      }
    }
    
    // Тут можна додати реальний запит до OpenAI API
    // Поки що імітуємо
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return {
      status: 'operational',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      assistants: {
        elite: 'online',
        standard: 'online'
      }
    }
  } catch (error) {
    return {
      status: 'degraded',
      responseTime: 0,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'OpenAI check failed'
    }
  }
}

async function checkExternalServices() {
  const services = []
  
  // Railway Status
  try {
    const response = await fetch('https://railway.app', {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000)
    })
    services.push({
      name: 'railway',
      status: response.ok ? 'operational' : 'degraded'
    })
  } catch {
    services.push({
      name: 'railway',
      status: 'unknown'
    })
  }
  
  return {
    status: services.every(s => s.status === 'operational') ? 'operational' : 'degraded',
    lastCheck: new Date().toISOString(),
    services
  }
}

// OPTIONS для CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
