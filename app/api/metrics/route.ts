import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '1h' // 1h, 24h, 7d, 30d
    const metric = searchParams.get('metric') // specific metric filter
    
    // В production ці дані прийдуть з БД моніторингу
    const metrics = await getMetricsData(timeframe, metric)
    
    return NextResponse.json({
      success: true,
      timeframe,
      timestamp: new Date().toISOString(),
      data: metrics
    })
    
  } catch (error) {
    console.error('Metrics API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve metrics',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function getMetricsData(timeframe: string, metric?: string | null) {
  // Mock data - в production з Prisma та БД моніторингу
  
  const currentMetrics = {
    responseTime: {
      current: 2.8,
      average24h: 2.1,
      trend: 'up',
      threshold: {
        warning: 2.0,
        critical: 5.0
      }
    },
    successRate: {
      current: 98.5,
      average24h: 98.8,
      trend: 'down',
      threshold: {
        warning: 95,
        critical: 90
      }
    },
    activeUsers: {
      current: 24,
      peak24h: 67,
      trend: 'stable'
    },
    generationsPerHour: {
      current: 142,
      average24h: 156,
      trend: 'down'
    },
    assistantUptime: {
      elite: 99.2,
      standard: 99.8,
      overall: 99.5
    },
    errorRate: {
      current: 1.5,
      average24h: 1.2,
      trend: 'up',
      threshold: {
        warning: 5,
        critical: 10
      }
    },
    queueLength: {
      current: 3,
      max24h: 15,
      average24h: 2.1
    },
    systemLoad: {
      cpu: 24,
      memory: 68,
      disk: 45,
      network: 12
    }
  }
  
  // Генерація історичних даних
  const historicalData = generateHistoricalData(timeframe)
  
  // Якщо запитана конкретна метрика
  if (metric && currentMetrics[metric as keyof typeof currentMetrics]) {
    return {
      [metric]: currentMetrics[metric as keyof typeof currentMetrics],
      historical: historicalData[metric] || []
    }
  }
  
  return {
    current: currentMetrics,
    historical: historicalData,
    alerts: await getActiveAlerts(),
    summary: {
      overallHealth: calculateOverallHealth(currentMetrics),
      criticalAlerts: 0,
      warningAlerts: 1,
      servicesDown: 0,
      servicesDegraded: 1
    }
  }
}

function generateHistoricalData(timeframe: string) {
  const now = new Date()
  const dataPoints = timeframe === '1h' ? 12 : timeframe === '24h' ? 24 : 168 // 1h=12pts, 24h=24pts, 7d=168pts
  const interval = timeframe === '1h' ? 5 : timeframe === '24h' ? 60 : 60 // minutes
  
  const data: any = {
    responseTime: [],
    successRate: [],
    generationsPerHour: [],
    errorRate: []
  }
  
  for (let i = dataPoints; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * interval * 60000))
    
    // Генерація реалістичних даних з трендами
    const baseResponseTime = 2.0 + Math.random() * 1.5
    const peakHours = timestamp.getHours() >= 9 && timestamp.getHours() <= 17
    const responseTime = peakHours ? baseResponseTime * 1.3 : baseResponseTime
    
    data.responseTime.push({
      timestamp: timestamp.toISOString(),
      elite: responseTime + Math.random() * 0.8,
      standard: responseTime * 0.6 + Math.random() * 0.3,
      average: responseTime
    })
    
    data.successRate.push({
      timestamp: timestamp.toISOString(),
      success: 97 + Math.random() * 2.5,
      errors: 0.5 + Math.random() * 2
    })
    
    data.generationsPerHour.push({
      timestamp: timestamp.toISOString(),
      count: peakHours ? 120 + Math.random() * 80 : 40 + Math.random() * 60
    })
    
    data.errorRate.push({
      timestamp: timestamp.toISOString(),
      rate: Math.random() * 3
    })
  }
  
  return data
}

async function getActiveAlerts() {
  // Mock alerts - в production з БД
  return [
    {
      id: 'ALT-001',
      severity: 'warning',
      metric: 'responseTime',
      message: 'Elite Assistant response time above warning threshold',
      threshold: 2000,
      currentValue: 2800,
      triggeredAt: new Date(Date.now() - 15 * 60000).toISOString(), // 15 min ago
      acknowledged: false
    }
  ]
}

function calculateOverallHealth(metrics: any): number {
  // Простий алгоритм розрахунку загального здоров'я
  let score = 100
  
  // Response time penalty
  if (metrics.responseTime.current > 5) score -= 30
  else if (metrics.responseTime.current > 2) score -= 10
  
  // Success rate penalty
  if (metrics.successRate.current < 90) score -= 40
  else if (metrics.successRate.current < 95) score -= 15
  
  // Error rate penalty
  if (metrics.errorRate.current > 10) score -= 25
  else if (metrics.errorRate.current > 5) score -= 10
  
  return Math.max(0, score)
}

// POST endpoint для запису нових метрик
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Валідація даних
    if (!body.metric || !body.value) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: metric, value'
      }, { status: 400 })
    }
    
    // В production тут буде запис в БД
    console.log('📊 New metric received:', body)
    
    // Тут буде логіка збереження в БД моніторингу
    // await saveMetricToDB(body)
    
    return NextResponse.json({
      success: true,
      message: 'Metric recorded',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Metrics POST error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to record metric'
    }, { status: 500 })
  }
}

// OPTIONS для CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
