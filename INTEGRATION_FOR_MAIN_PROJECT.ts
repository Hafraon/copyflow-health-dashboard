// CopyFlow Monitoring Client
// Lightweight integration for sending metrics to Health Dashboard
// Додай цей файл в основний проект: lib/monitoring-client.ts

export interface MonitoringMetric {
  metric: string
  value: number
  timestamp?: string
  metadata?: {
    assistantUsed?: string
    success?: boolean
    userId?: string
    requestSize?: number
    errorType?: string
    errorMessage?: string
    generationType?: string
    [key: string]: any
  }
}

class MonitoringClient {
  private dashboardUrl: string
  private enabled: boolean

  constructor() {
    this.dashboardUrl = process.env.MONITORING_DASHBOARD_URL || 'http://localhost:3001'
    this.enabled = process.env.MONITORING_ENABLED === 'true'
    
    if (this.enabled) {
      console.log('📊 Monitoring client initialized:', this.dashboardUrl)
    }
  }

  async logMetric(metric: string, value: number, metadata?: any): Promise<void> {
    if (!this.enabled) return

    try {
      const payload: MonitoringMetric = {
        metric,
        value,
        timestamp: new Date().toISOString(),
        metadata
      }

      // Async request - не блокує основний процес
      fetch(`${this.dashboardUrl}/api/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CopyFlow-Main-Project/1.0'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000) // 5-second timeout
      }).catch(error => {
        // Silent fail - не зламуємо основний функціонал
        console.warn('📊 Monitoring metric failed (silent):', error.message)
      })

    } catch (error) {
      // Silent fail - критично важливо не зламати основний проект
      console.warn('📊 Monitoring client error (silent):', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  // Спеціалізовані методи для різних типів метрик
  async logGeneration(processingTime: number, metadata: {
    assistantUsed: string
    success: boolean
    userId?: string
    requestSize?: number
    errorType?: string
    errorMessage?: string
  }): Promise<void> {
    await this.logMetric('generation_time', processingTime, {
      ...metadata,
      generationType: 'standard'
    })
  }

  async logAdvancedGeneration(processingTime: number, metadata: {
    assistantUsed: string
    success: boolean
    userId?: string
    productsCount?: number
    errorType?: string
    errorMessage?: string
  }): Promise<void> {
    await this.logMetric('generation_time', processingTime, {
      ...metadata,
      generationType: 'advanced'
    })
  }

  async logAPICall(endpoint: string, responseTime: number, success: boolean, metadata?: any): Promise<void> {
    await this.logMetric('api_response_time', responseTime, {
      endpoint,
      success,
      ...metadata
    })
  }

  async logError(error: Error, context?: string): Promise<void> {
    await this.logMetric('error_count', 1, {
      errorType: error.name,
      errorMessage: error.message,
      context,
      success: false
    })
  }

  async logDatabaseQuery(queryTime: number, queryType: string, success: boolean): Promise<void> {
    await this.logMetric('database_query_time', queryTime, {
      queryType,
      success
    })
  }

  async logUserActivity(action: string, userId?: string): Promise<void> {
    await this.logMetric('user_activity', 1, {
      action,
      userId,
      timestamp: new Date().toISOString()
    })
  }

  // Health check for monitoring system
  async healthCheck(): Promise<boolean> {
    if (!this.enabled) return false

    try {
      const response = await fetch(`${this.dashboardUrl}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      })
      
      return response.ok
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const monitoringClient = new MonitoringClient()

// Export convenience functions
export async function logMetric(metric: string, value: number, metadata?: any): Promise<void> {
  return monitoringClient.logMetric(metric, value, metadata)
}

export async function logGeneration(processingTime: number, assistantUsed: string, success: boolean, metadata?: any): Promise<void> {
  return monitoringClient.logGeneration(processingTime, {
    assistantUsed,
    success,
    ...metadata
  })
}

export async function logError(error: Error, context?: string): Promise<void> {
  return monitoringClient.logError(error, context)
}

export async function logAPICall(endpoint: string, responseTime: number, success: boolean, metadata?: any): Promise<void> {
  return monitoringClient.logAPICall(endpoint, responseTime, success, metadata)
}

// Helper для декораторів API routes
export function withMonitoring<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  endpoint: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now()
    let success = false
    let error: Error | null = null

    try {
      const result = await fn(...args)
      success = true
      return result
    } catch (err) {
      error = err instanceof Error ? err : new Error('Unknown error')
      throw err
    } finally {
      const responseTime = Date.now() - startTime
      
      await logAPICall(endpoint, responseTime, success, {
        error: error ? error.message : undefined
      })
      
      if (error) {
        await logError(error, endpoint)
      }
    }
  }
}
