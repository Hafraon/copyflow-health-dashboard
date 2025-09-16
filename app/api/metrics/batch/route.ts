import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST endpoint для групової записі метрик
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
    if (!body.metrics || !Array.isArray(body.metrics)) {
      return NextResponse.json({
        success: false,
        error: 'Missing or invalid metrics array'
      }, { status: 400 })
    }
    
    console.log(`📊 Batch metrics received: ${body.metrics.length} items`)
    
    let processed = 0
    let errors = 0
    const errorDetails: string[] = []
    
    // Обробка кожної метрики в транзакції
    await prisma.$transaction(async (tx: any) => {
      for (const metric of body.metrics) {
        try {
          await saveBatchMetricToDB(metric, tx)
          processed++
        } catch (error) {
          errors++
          const message = error instanceof Error ? error.message : String(error)
          errorDetails.push(`Metric ${metric.metric}: ${message}`)
          console.error('Batch metric error:', message)
        }
      }
    })
    
    console.log(`📊 Batch processing complete: ${processed} saved, ${errors} errors`)
    
    return NextResponse.json({
      success: true,
      message: 'Batch metrics processed',
      processed,
      errors,
      errorDetails: errors > 0 ? errorDetails : undefined,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Batch metrics API error:', message)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process batch metrics',
      details: message
    }, { status: 500 })
  }
}

// Збереження метрики в транзакції
async function saveBatchMetricToDB(metric: any, tx: any) {
  const { metric: metricName, value, timestamp, metadata } = metric
  
  if (!metricName || value === undefined) {
    throw new Error('Invalid metric format')
  }
  
  switch (metricName) {
    case 'generation_performance':
      await tx.generationLogs.create({
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
          },
          createdAt: timestamp ? new Date(timestamp) : new Date()
        }
      })
      break
      
    case 'model_usage':
      // Log model usage statistics
      await tx.generationLogs.create({
        data: {
          requestId: `model-${Date.now()}`,
          generationType: 'model_usage',
          assistantUsed: metadata?.model || 'unknown',
          processingTime: 0,
          success: metadata?.success || false,
          metadata: {
            service: metadata?.service,
            model: metadata?.model
          },
          createdAt: timestamp ? new Date(timestamp) : new Date()
        }
      })
      break
      
    case 'credit_operation':
      await tx.generationLogs.create({
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
          },
          createdAt: timestamp ? new Date(timestamp) : new Date()
        }
      })
      break
      
    case 'credit_balance':
      // Special handling for balance tracking
      await tx.generationLogs.create({
        data: {
          requestId: `balance-${Date.now()}`,
          userId: metadata?.userId,
          generationType: 'balance_update',
          assistantUsed: 'credit_manager',
          processingTime: 0,
          success: true,
          metadata: {
            balance: value,
            service: metadata?.service
          },
          createdAt: timestamp ? new Date(timestamp) : new Date()
        }
      })
      break
      
    case 'wallet_transaction':
      await tx.generationLogs.create({
        data: {
          requestId: metadata?.transactionId,
          userId: metadata?.userId,
          generationType: 'wallet_transaction',
          assistantUsed: 'wallet_service',
          processingTime: metadata?.processingTime || 0,
          success: metadata?.success || false,
          errorType: metadata?.errorType,
          errorMessage: metadata?.errorMessage,
          metadata: {
            walletOperation: metadata?.walletOperation,
            amount: value,
            currency: metadata?.currency,
            balanceBefore: metadata?.balanceBefore,
            balanceAfter: metadata?.balanceAfter
          },
          createdAt: timestamp ? new Date(timestamp) : new Date()
        }
      })
      break
      
    case 'payment_transaction':
      await tx.generationLogs.create({
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
            paymentStatus: metadata?.paymentStatus,
            webhookReceived: metadata?.webhookReceived
          },
          createdAt: timestamp ? new Date(timestamp) : new Date()
        }
      })
      break
      
    case 'revenue':
      // Revenue tracking
      await tx.generationLogs.create({
        data: {
          requestId: `revenue-${Date.now()}`,
          generationType: 'revenue',
          assistantUsed: metadata?.service || 'wayforpay',
          processingTime: 0,
          success: true,
          metadata: {
            amount: value,
            currency: metadata?.currency,
            planType: metadata?.planType,
            service: metadata?.service
          },
          createdAt: timestamp ? new Date(timestamp) : new Date()
        }
      })
      break
      
    case 'auth_action':
      await tx.generationLogs.create({
        data: {
          requestId: `auth-${Date.now()}`,
          userId: metadata?.userId,
          generationType: 'auth_action',
          assistantUsed: 'nextauth',
          processingTime: 0,
          success: metadata?.success || false,
          errorType: metadata?.errorType,
          errorMessage: metadata?.errorMessage,
          metadata: {
            action: metadata?.action,
            provider: metadata?.provider,
            userAgent: metadata?.userAgent,
            ipAddress: metadata?.ipAddress
          },
          createdAt: timestamp ? new Date(timestamp) : new Date()
        }
      })
      break
      
    case 'api_response_time':
      await tx.generationLogs.create({
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
            statusCode: metadata?.statusCode,
            requestSize: metadata?.requestSize,
            responseSize: metadata?.responseSize
          },
          createdAt: timestamp ? new Date(timestamp) : new Date()
        }
      })
      break
      
    case 'system_health':
      await tx.systemHealth.create({
        data: {
          service: metadata?.service || 'unknown',
          status: getHealthStatus(value),
          responseTime: metadata?.responseTime,
          uptime: metadata?.uptime,
          lastCheck: timestamp ? new Date(timestamp) : new Date(),
          metadata: {
            memoryUsage: metadata?.memoryUsage,
            cpuUsage: metadata?.cpuUsage,
            errorMessage: metadata?.errorMessage,
            status: metadata?.status
          }
        }
      })
      break
      
    case 'user_activity':
      await tx.generationLogs.create({
        data: {
          requestId: `activity-${Date.now()}`,
          userId: metadata?.userId,
          generationType: 'user_activity',
          assistantUsed: 'user_tracking',
          processingTime: 0,
          success: true,
          metadata: {
            action: metadata?.action,
            sessionId: metadata?.sessionId,
            service: metadata?.service,
            ...metadata
          },
          createdAt: timestamp ? new Date(timestamp) : new Date()
        }
      })
      break
      
    case 'error_occurrence':
      await tx.incidentLogs.create({
        data: {
          severity: mapSeverityValue(value),
          service: metadata?.service || 'unknown',
          title: `${metadata?.errorType}: ${metadata?.service}`,
          description: metadata?.errorMessage,
          status: 'investigating',
          alertSent: false,
          startTime: timestamp ? new Date(timestamp) : new Date()
        }
      })
      break
      
    case 'operation_performance':
      await tx.generationLogs.create({
        data: {
          requestId: metadata?.requestId,
          userId: metadata?.userId,
          generationType: 'operation_performance',
          assistantUsed: metadata?.service || 'unknown',
          processingTime: value,
          success: metadata?.success || false,
          errorType: metadata?.errorType,
          errorMessage: metadata?.errorMessage,
          metadata: {
            operation: metadata?.operation,
            service: metadata?.service,
            ...metadata
          },
          createdAt: timestamp ? new Date(timestamp) : new Date()
        }
      })
      break
      
    default:
      console.log('Unknown batch metric type:', metricName)
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

// OPTIONS для CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Source',
    },
  })
}
