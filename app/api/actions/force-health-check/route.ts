import { NextRequest, NextResponse } from 'next/server';
import { getSystemHealth } from '@/lib/monitoring';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [FORCE-HEALTH-CHECK] Starting manual health check...');
    
    const startTime = Date.now();
    
    // Викликати comprehensive health check
    const healthResults = await getSystemHealth();
    
    const processingTime = Date.now() - startTime;
    
    // Підрахувати загальну статистику
    const totalServices = healthResults.length;
    const operationalServices = healthResults.filter(s => s.status === 'operational').length;
    const degradedServices = healthResults.filter(s => s.status === 'degraded').length;
    const majorIssues = healthResults.filter(s => s.status === 'major').length;
    
    const overallHealthScore = Math.round((operationalServices / totalServices) * 100);
    
    console.log('✅ [FORCE-HEALTH-CHECK] Health check completed');
    console.log(`📊 [FORCE-HEALTH-CHECK] ${operationalServices}/${totalServices} services operational`);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processingTime: processingTime + 'ms',
      summary: {
        totalServices,
        operationalServices,
        degradedServices,
        majorIssues,
        healthScore: overallHealthScore + '%'
      },
      services: healthResults.map(service => ({
        name: service.service,
        status: service.status,
        responseTime: service.responseTime + 'ms',
        lastCheck: service.lastCheck,
        metadata: service.metadata
      }))
    });
    
  } catch (error) {
    console.error('❌ [FORCE-HEALTH-CHECK] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
