import { NextResponse } from 'next/server'
import { checkServiceHealth, getRealAssistantStatus } from '@/lib/monitoring'
import { prisma } from '@/lib/monitoring'

// Force dynamic for real-time data
export const dynamic = 'force-dynamic'

interface ServiceCheck {
  name: string
  status: 'operational' | 'degraded' | 'partial' | 'major' | 'maintenance'
  responseTime?: number
  lastChecked: string
  description: string
  error?: string
}

export async function GET() {
  try {
    const startTime = Date.now()
    
    // Parallel service checks
    const [
      mainAppResult,
      databaseResult,
      assistantsResult,
      authResult
    ] = await Promise.allSettled([
      checkMainApplication(),
      checkDatabase(),
      checkOpenAIAssistants(),
      checkAuthentication()
    ])

    const services: ServiceCheck[] = [
      getResult(mainAppResult, 'main'),
      getResult(databaseResult, 'database'), 
      getResult(assistantsResult, 'assistants'),
      getResult(authResult, 'auth')
    ].filter(Boolean) as ServiceCheck[]

    const processingTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      services,
      summary: {
        total: services.length,
        operational: services.filter(s => s.status === 'operational').length,
        degraded: services.filter(s => s.status === 'degraded').length,
        issues: services.filter(s => ['major'].includes(s.status)).length,  // Тільки major = справжні проблеми
        workingServices: services.filter(s => ['operational', 'degraded', 'partial'].includes(s.status)).length  // Додаємо лічильник працюючих
      },
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Service status check failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check service status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper to safely extract results
function getResult(result: PromiseSettledResult<any>, type: string): ServiceCheck | null {
  if (result.status === 'fulfilled' && result.value) {
    return result.value
  } else {
    // Return error state for failed checks
    switch (type) {
      case 'main':
        return {
          name: 'CopyFlow Application',
          status: 'major',
          description: 'Main application and API endpoints',
          lastChecked: 'Check failed',
          error: result.status === 'rejected' ? result.reason?.message : 'Unknown error'
        }
      case 'database':
        return {
          name: 'Database',
          status: 'major', 
          description: 'PostgreSQL database connection',
          lastChecked: 'Check failed',
          error: 'Database connection failed'
        }
      default:
        return null
    }
  }
}

// Check main CopyFlow application
async function checkMainApplication(): Promise<ServiceCheck> {
  const mainProjectUrl = process.env.MAIN_PROJECT_API_URL
  
  if (!mainProjectUrl) {
    return {
      name: 'CopyFlow Application',
      status: 'major',
      description: 'Main application and API endpoints',
      lastChecked: 'Not configured',
      error: 'MAIN_PROJECT_API_URL not set'
    }
  }

  const startTime = Date.now()
  
  try {
    const response = await fetch(`${mainProjectUrl}/api/health`, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'CopyFlow-Health-Dashboard/1.0'
      }
    })
    
    const responseTime = Date.now() - startTime
    
    if (response.ok) {
      return {
        name: 'CopyFlow Application',
        status: responseTime > 3000 ? 'degraded' : 'operational',  // Більш реалістичний threshold
        responseTime,
        description: 'Main application and API endpoints',
        lastChecked: 'Just now'
      }
    } else if (response.status >= 400 && response.status < 500) {
      // Client errors (404, 401, etc.) - але якщо відповідає швидко, то partial
      return {
        name: 'CopyFlow Application',
        status: responseTime < 1000 ? 'partial' : 'degraded',
        responseTime,
        description: 'Main application and API endpoints',
        lastChecked: 'Just now',
        error: `HTTP ${response.status}`
      }
    } else {
      // Server errors (500+) - degraded
      return {
        name: 'CopyFlow Application',
        status: 'degraded',
        responseTime,
        description: 'Main application and API endpoints',
        lastChecked: 'Just now',
        error: `HTTP ${response.status}`
      }
    }
  } catch (error) {
    return {
      name: 'CopyFlow Application',
      status: 'major',
      responseTime: Date.now() - startTime,
      description: 'Main application and API endpoints',
      lastChecked: 'Just now',
      error: error instanceof Error ? error.message : 'Connection failed'
    }
  }
}

// Check PostgreSQL database
async function checkDatabase(): Promise<ServiceCheck> {
  const startTime = Date.now()
  
  try {
    // Simple connectivity test
    await prisma.$queryRaw`SELECT 1 as test`
    const responseTime = Date.now() - startTime
    
    return {
      name: 'Database',
      status: responseTime > 1000 ? 'degraded' : 'operational',
      responseTime,
      description: 'PostgreSQL database on Railway',
      lastChecked: 'Just now'
    }
  } catch (error) {
    return {
      name: 'Database',
      status: 'major',
      responseTime: Date.now() - startTime,
      description: 'PostgreSQL database on Railway',
      lastChecked: 'Just now',
      error: error instanceof Error ? error.message : 'Database connection failed'
    }
  }
}

// Check OpenAI Assistants
async function checkOpenAIAssistants(): Promise<ServiceCheck | null> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      name: 'OpenAI Assistants',
      status: 'major',
      description: 'AI content generation assistants',
      lastChecked: 'Not configured',
      error: 'OpenAI API key not configured'
    }
  }

  const startTime = Date.now()
  
  try {
    const assistants = await getRealAssistantStatus()
    const responseTime = Date.now() - startTime
    
    if (assistants.length === 0) {
      return {
        name: 'OpenAI Assistants',
        status: 'major',
        responseTime,
        description: 'AI content generation assistants',
        lastChecked: 'Just now',
        error: 'No assistants configured'
      }
    }
    
    const onlineCount = assistants.filter((a: any) => a.status === 'online').length
    const degradedCount = assistants.filter((a: any) => a.status === 'degraded').length
    
    let status: ServiceCheck['status'] = 'operational'
    if (onlineCount === 0) {
      status = 'major'
    } else if (degradedCount > 0 || onlineCount < assistants.length) {
      status = 'degraded'
    }
    
    const avgResponseTime = assistants.reduce((sum: number, a: any) => sum + (a.responseTime || 0), 0) / assistants.length
    
    return {
      name: 'OpenAI Assistants',
      status,
      responseTime: Math.round(avgResponseTime),
      description: `AI content generation assistants (${onlineCount}/${assistants.length} online)`,
      lastChecked: 'Just now'
    }
  } catch (error) {
    return {
      name: 'OpenAI Assistants',
      status: 'major',
      responseTime: Date.now() - startTime,
      description: 'AI content generation assistants',
      lastChecked: 'Just now',
      error: error instanceof Error ? error.message : 'Assistant check failed'
    }
  }
}

// Check Authentication system
async function checkAuthentication(): Promise<ServiceCheck | null> {
  const mainProjectUrl = process.env.MAIN_PROJECT_API_URL
  
  if (!mainProjectUrl) {
    return null // Skip if main project not configured
  }

  const startTime = Date.now()
  
  try {
    // Try to check auth endpoint
    const response = await fetch(`${mainProjectUrl}/api/auth/status`, {
      signal: AbortSignal.timeout(5000)
    })
    
    const responseTime = Date.now() - startTime
    
    if (response.ok) {
      return {
        name: 'Authentication',
        status: responseTime > 2000 ? 'degraded' : 'operational',
        responseTime,
        description: 'User authentication and authorization',
        lastChecked: 'Just now'
      }
    } else if (response.status === 404) {
      // Auth endpoint doesn't exist - skip this service
      return null
    } else {
      return {
        name: 'Authentication',
        status: 'partial',
        responseTime,
        description: 'User authentication and authorization',
        lastChecked: 'Just now',
        error: `HTTP ${response.status}`
      }
    }
  } catch (error) {
    // If auth check fails, don't show it as major issue
    // It might not be implemented yet
    return null
  }
}
