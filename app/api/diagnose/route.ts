import { NextResponse } from 'next/server'

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      mainProjectUrl: process.env.MAIN_PROJECT_API_URL,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasEliteAssistant: !!process.env.OPENAI_ASSISTANT_ELITE,
      hasUniversalAssistant: !!process.env.OPENAI_ASSISTANT_UNIVERSAL,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    },
    tests: {}
  }

  // Test 1: Main Project Connection
  try {
    const mainProjectUrl = process.env.MAIN_PROJECT_API_URL || 'https://copyflow.pro'
    const startTime = Date.now()
    const response = await fetch(`${mainProjectUrl}/api/health`, {
      signal: AbortSignal.timeout(10000)
    })
    const responseTime = Date.now() - startTime
    
    results.tests.mainProject = {
      url: mainProjectUrl,
      healthEndpoint: `${mainProjectUrl}/api/health`,
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
      success: response.ok
    }
    
    if (response.ok) {
      try {
        const data = await response.json()
        results.tests.mainProject.healthData = data
      } catch (e) {
        results.tests.mainProject.healthData = 'Failed to parse JSON'
      }
    } else {
      results.tests.mainProject.recommendation = response.status === 404 ? 
        'Health endpoint not found - add /api/health to copyflow.pro' :
        'Health endpoint returned error - check copyflow.pro server'
    }
  } catch (error) {
    results.tests.mainProject = {
      error: error instanceof Error ? error.message : 'Connection failed',
      url: process.env.MAIN_PROJECT_API_URL || 'https://copyflow.pro',
      recommendation: 'Check if copyflow.pro is accessible and has /api/health endpoint'
    }
  }

  // Test 2: External Services Status APIs
  const externalServices = [
    { name: 'Railway', url: 'https://status.railway.app/api/v2/status.json' },
    { name: 'Supabase', url: 'https://status.supabase.com/api/v2/status.json' },
    { name: 'OpenAI', url: 'https://status.openai.com/api/v2/status.json' }
  ]

  results.tests.externalServices = {}
  
  for (const service of externalServices) {
    try {
      const startTime = Date.now()
      const response = await fetch(service.url, {
        signal: AbortSignal.timeout(8000)
      })
      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        const data = await response.json()
        results.tests.externalServices[service.name] = {
          success: true,
          responseTime: `${responseTime}ms`,
          status: data.status?.indicator || 'unknown',
          description: data.status?.description || 'No description',
          mappedStatus: data.status?.indicator === 'none' ? 'operational' : 
                       data.status?.indicator === 'minor' ? 'degraded' : 
                       data.status?.indicator === 'major' ? 'outage' : 'unknown'
        }
      } else {
        results.tests.externalServices[service.name] = {
          success: false,
          httpStatus: response.status,
          statusText: response.statusText,
          responseTime: `${responseTime}ms`
        }
      }
    } catch (error) {
      results.tests.externalServices[service.name] = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Test 3: OpenAI API Connection (if configured)
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_ASSISTANT_ELITE) {
    try {
      const startTime = Date.now()
      const response = await fetch(`https://api.openai.com/v1/assistants/${process.env.OPENAI_ASSISTANT_ELITE}`, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        },
        signal: AbortSignal.timeout(10000)
      })
      const responseTime = Date.now() - startTime
      
      results.tests.openAI = {
        assistantId: process.env.OPENAI_ASSISTANT_ELITE.substring(0, 10) + '...',
        status: response.status,
        statusText: response.statusText,
        responseTime: `${responseTime}ms`,
        success: response.ok
      }
      
      if (response.ok) {
        const data = await response.json()
        results.tests.openAI.assistantName = data.name
        results.tests.openAI.model = data.model
      }
    } catch (error) {
      results.tests.openAI = {
        error: error instanceof Error ? error.message : 'OpenAI connection failed'
      }
    }
  } else {
    results.tests.openAI = {
      error: 'OpenAI credentials not configured'
    }
  }

  // Test 4: Database Connection
  try {
    const { prisma } = await import('@/lib/monitoring')
    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1 as test`
    const responseTime = Date.now() - startTime
    
    results.tests.database = {
      success: true,
      responseTime: `${responseTime}ms`,
      connectionString: process.env.DATABASE_URL ? 'Configured' : 'Not configured'
    }
  } catch (error) {
    results.tests.database = {
      success: false,
      error: error instanceof Error ? error.message : 'Database connection failed'
    }
  }

  // Summary
  results.summary = {
    mainProjectOnline: results.tests.mainProject?.success || false,
    databaseOnline: results.tests.database?.success || false,
    openAIOnline: results.tests.openAI?.success || false,
    externalServicesIssues: Object.values(results.tests.externalServices || {})
      .filter((service: any) => !service.success || service.mappedStatus !== 'operational').length,
    recommendations: [],
    liveUrls: {
      mainProject: 'https://copyflow.pro',
      healthEndpoint: 'https://copyflow.pro/api/health',
      liveDashboard: 'https://copyflow-health-dashboard-production.up.railway.app/',
      diagnostics: 'https://copyflow-health-dashboard-production.up.railway.app/api/diagnose'
    }
  }

  // Recommendations
  if (!results.summary.mainProjectOnline) {
    if (results.tests.mainProject?.status === 404) {
      results.summary.recommendations.push('Add /api/health endpoint to copyflow.pro - see COPYFLOW_PRO_HEALTH_ENDPOINT.md')
    } else {
      results.summary.recommendations.push('Check if copyflow.pro is accessible and running properly')
    }
  }
  if (!results.summary.openAIOnline) {
    results.summary.recommendations.push('Configure OpenAI API credentials (OPENAI_API_KEY, OPENAI_ASSISTANT_ELITE, OPENAI_ASSISTANT_UNIVERSAL)')
  }
  if (!results.summary.databaseOnline) {
    results.summary.recommendations.push('Check DATABASE_URL configuration and database connectivity')
  }
  
  // Add live URLs for easy access
  results.summary.recommendations.push('Check live dashboard: https://copyflow-health-dashboard-production.up.railway.app/')
  results.summary.recommendations.push('Test health endpoint: https://copyflow.pro/api/health')

  return NextResponse.json(results, { status: 200 })
}
