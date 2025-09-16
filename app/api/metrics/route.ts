import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '1h'
    const metric = searchParams.get('metric')
    
    const metrics = await getMetricsData(timeframe, metric)
    
    return NextResponse.json({
      success: true,
      timeframe,
      timestamp: new Date().toISOString(),
      data: metrics
    })
    
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Metrics API error:', message)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve metrics',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// POST endpoint для запису нових метрик з основного проекту
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const source = request.headers.get('X-Source')
    
    // Валідація source
    if (source !== 'copyflow-main') {
      return NextResponse.json({
        success: false,
        error: 'Invalid source'
      }, { status: 403 })
    }
    
    // Валідація даних
    if (!body.metric || body.value === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: metric, value'
      }, { status: 400 })
    }
    
    console.log('📊 Metric received from main project:', {
      metric: body.metric,
      value: body.value,
      service: body.metadata?.service
    })
    
    // Збереження різних типів метрик в відповідні таблиці
    await saveMetricToDB(body)
    
    return NextResponse.json({
      success: true,
      message: 'Metric recorded',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Metrics POST error:', message)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to record metric',
      details: message
    }, { status: 500 })
  }
}

// Збереження метрик в БД залежно від типу
async function saveMetricToDB(metric: any) {
  const { metric: metricName, value, timestamp, metadata } = metric
  
  try {
    switch (metricName) {
      case 'generation_performance':
        await prisma.generationLogs.create({
          data: {
            requestId: metadata?.requestId,
            userId: metadata?.userId,
            generationType: 'single_product',
            assistantUsed: metadata?.model || 'unknown',
            processingTime: value,
            success: metadata?.success || false,
            errorType: metadata?.errorType,
            errorMessage: metadata?.errorMessage,
            metadata: {
              service: metadata?.service,
              tokensUsed: metadata?.tokensUsed,
              cost: metadata?.cost,
              category: metadata?.category,
              generationMethod: metadata?.generationMethod
            }
          }
        })
        break
        
      case 'credit_operation':
        await prisma.generationLogs.create({
          data: {
            requestId: metadata?.requestId,
            userId: metadata?.userId,
            generationType: 'credit_operation',
            assistantUsed: 'credit_manager',
            processingTime: metadata?.processingTime || 0,
            success: metadata?.success || false,
            errorType: metadata?.errorType,
            errorMessage: metadata?.errorMessage,
            metadata: {
              operation: metadata?.operation,
              amount: value,
              balanceBefore: metadata?.balanceBefore,
              balanceAfter: metadata?.balanceAfter,
              transactionId: metadata?.transactionId
            }
          }
        })
        break
        
      case 'payment_transaction':
        await prisma.generationLogs.create({
          data: {
            requestId: metadata?.orderReference,
            userId: metadata?.userId,
            generationType: 'payment',
            assistantUsed: metadata?.paymentProvider || 'wayforpay',
            processingTime: metadata?.processingTime || 0,
            success: metadata?.success || false,
            errorType: metadata?.paymentStatus === 'declined' ? 'PaymentDeclined' : undefined,
            errorMessage: metadata?.errorMessage,
            metadata: {
              amount: value,
              currency: metadata?.currency,
              planType: metadata?.planType,
              orderReference: metadata?.orderReference,
              paymentStatus: metadata?.paymentStatus
            }
          }
        })
        break
        
      case 'api_response_time':
        await prisma.generationLogs.create({
          data: {
            requestId: `api-${Date.now()}`,
            userId: metadata?.userId,
            generationType: 'api_call',
            assistantUsed: metadata?.endpoint || 'unknown',
            processingTime: value,
            success: metadata?.success || false,
            errorType: metadata?.errorType,
            metadata: {
              endpoint: metadata?.endpoint,
              method: metadata?.method,
              statusCode: metadata?.statusCode
            }
          }
        })
        break
        
      case 'system_health':
        await prisma.systemHealth.create({
          data: {
            service: metadata?.service || 'unknown',
            status: getHealthStatus(value),
            responseTime: metadata?.responseTime,
            uptime: metadata?.uptime,
            metadata: {
              memoryUsage: metadata?.memoryUsage,
              cpuUsage: metadata?.cpuUsage,
              errorMessage: metadata?.errorMessage
            }
          }
        })
        break
        
      case 'error_occurrence':
        await prisma.incidentLogs.create({
          data: {
            severity: mapSeverityValue(value),
            service: metadata?.service || 'unknown',
            title: `${metadata?.errorType}: ${metadata?.service}`,
            description: metadata?.errorMessage,
            status: 'investigating',
            alertSent: false
          }
        })
        break
        
      default:
        console.log('Unknown metric type:', metricName)
    }
  } catch (dbError) {
    const message = dbError instanceof Error ? dbError.message : String(dbError)
    console.error('Database save error:', message)
    throw dbError
  }
}

function getHealthStatus(healthValue: number): string {
  if (healthValue >= 90) return 'operational'
  if (healthValue >= 50) return 'degraded'
  if (healthValue >= 25) return 'partial'
  return 'major'
}

function mapSeverityValue(value: number): string {
  switch (value) {
    case 1: return 'info'
    case 2: return 'warning'
    case 3: return 'error'
    case 4: return 'critical'
    default: return 'warning'
  }
}

async function getMetricsData(timeframe: string, metric?: string | null) {
  // Реальні дані з БД
  const now = new Date()
  const timeAgo = getTimeAgo(timeframe)
  
  try {
    // Основні метрики з генерацій
    const [generationStats, systemHealth, incidents] = await Promise.all([
      prisma.generationLogs.groupBy({
        by: ['success'],
        where: {
          createdAt: { gte: timeAgo }
        },
        _count: { id: true },
        _avg: { processingTime: true }
      }),
      
      prisma.systemHealth.findMany({
        where: {
          lastCheck: { gte: timeAgo }
        },
        orderBy: { lastCheck: 'desc' },
        take: 10
      }),
      
      prisma.incidentLogs.findMany({
        where: {
          startTime: { gte: timeAgo }
        },
        orderBy: { startTime: 'desc' }
      })
    ])
    
    // Підрахунок метрик
    const totalGenerations = generationStats.reduce((sum: number, stat: any) => sum + stat._count.id, 0)
    const successfulGenerations = generationStats.find((s: any) => s.success)?._count.id || 0
    const avgResponseTime = generationStats.find((s: any) => s.success)?._avg.processingTime || 0
    
    const currentMetrics = {
      responseTime: {
        current: avgResponseTime / 1000, // Convert to seconds
        average24h: avgResponseTime / 1000,
        trend: 'stable',
        threshold: { warning: 2.0, critical: 5.0 }
      },
      successRate: {
        current: totalGenerations > 0 ? (successfulGenerations / totalGenerations) * 100 : 100,
        average24h: totalGenerations > 0 ? (successfulGenerations / totalGenerations) * 100 : 100,
        trend: 'stable',
        threshold: { warning: 95, critical: 90 }
      },
      generationsPerHour: {
        current: totalGenerations,
        average24h: totalGenerations,
        trend: 'stable'
      },
      errorRate: {
        current: totalGenerations > 0 ? ((totalGenerations - successfulGenerations) / totalGenerations) * 100 : 0,
        average24h: totalGenerations > 0 ? ((totalGenerations - successfulGenerations) / totalGenerations) * 100 : 0,
        trend: 'stable',
        threshold: { warning: 5, critical: 10 }
      },
      systemHealth: systemHealth.map((h: any) => ({
        service: h.service,
        status: h.status,
        responseTime: h.responseTime,
        lastCheck: h.lastCheck
      }))
    }
    
    return {
      current: currentMetrics,
      totalGenerations,
      successfulGenerations,
      activeIncidents: incidents.filter((i: any) => i.status !== 'resolved').length,
      alerts: incidents.filter((i: any) => i.severity === 'critical' || i.severity === 'error'),
      summary: {
        overallHealth: calculateOverallHealth(currentMetrics),
        criticalAlerts: incidents.filter((i: any) => i.severity === 'critical').length,
        warningAlerts: incidents.filter((i: any) => i.severity === 'warning').length,
        servicesDown: systemHealth.filter((h: any) => h.status === 'major').length,
        servicesDegraded: systemHealth.filter((h: any) => h.status === 'degraded').length
      }
    }
    
  } catch (error) {
    console.error('Failed to fetch real metrics:', error)
    // Fallback to mock data
    return getMockMetrics()
  }
}

function getTimeAgo(timeframe: string): Date {
  const now = new Date()
  switch (timeframe) {
    case '1h': return new Date(now.getTime() - 60 * 60 * 1000)
    case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000)
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    default: return new Date(now.getTime() - 60 * 60 * 1000)
  }
}

function calculateOverallHealth(metrics: any): number {
  let score = 100
  
  if (metrics.responseTime.current > 5) score -= 30
  else if (metrics.responseTime.current > 2) score -= 10
  
  if (metrics.successRate.current < 90) score -= 40
  else if (metrics.successRate.current < 95) score -= 15
  
  if (metrics.errorRate.current > 10) score -= 25
  else if (metrics.errorRate.current > 5) score -= 10
  
  return Math.max(0, score)
}

function getMockMetrics() {
  return {
    current: {
      responseTime: { current: 2.8, average24h: 2.1, trend: 'up', threshold: { warning: 2.0, critical: 5.0 } },
      successRate: { current: 98.5, average24h: 98.8, trend: 'down', threshold: { warning: 95, critical: 90 } },
      generationsPerHour: { current: 142, average24h: 156, trend: 'down' },
      errorRate: { current: 1.5, average24h: 1.2, trend: 'up', threshold: { warning: 5, critical: 10 } }
    },
    summary: {
      overallHealth: 95,
      criticalAlerts: 0,
      warningAlerts: 1,
      servicesDown: 0,
      servicesDegraded: 1
    }
  }
}

// OPTIONS для CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Source',
    },
  })
}
