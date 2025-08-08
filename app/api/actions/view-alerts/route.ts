import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/monitoring'; // Динамічний імпорт для уникнення build errors

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // Уникнення static generation для API routes

export async function GET(request: NextRequest) {
  try {
    console.log('🚨 [VIEW-ALERTS] Fetching active alerts...');
    
    // Динамічний імпорт prisma
    const { prisma } = await import('@/lib/monitoring');
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    
    // Build filter conditions
    const whereConditions: any = {};
    
    if (severity) {
      whereConditions.severity = severity;
    }
    
    if (status) {
      whereConditions.status = status;
    } else {
      // By default, show only active alerts
      whereConditions.status = {
        in: ['investigating', 'identified', 'monitoring']
      };
    }
    
    // Fetch active alerts
    const alerts = await prisma.incidentLogs.findMany({
      where: whereConditions,
      orderBy: {
        startTime: 'desc'
      },
      take: limit
    });
    
    // Fetch alert rules
    const alertRules = await prisma.alertRules.findMany({
      where: {
        enabled: true
      },
      orderBy: {
        severity: 'desc'
      }
    });
    
    // Get summary statistics
    const alertStats = await prisma.incidentLogs.groupBy({
      by: ['severity'],
      where: {
        status: {
          in: ['investigating', 'identified', 'monitoring']
        }
      },
      _count: {
        severity: true
      }
    });
    
    // Calculate alert summary
    const totalActiveAlerts = alerts.length;
    const criticalAlerts = alerts.filter((a: any) => a.severity === 'critical').length;
    const errorAlerts = alerts.filter((a: any) => a.severity === 'error').length;
    const warningAlerts = alerts.filter((a: any) => a.severity === 'warning').length;
    const infoAlerts = alerts.filter((a: any) => a.severity === 'info').length;
    
    console.log('✅ [VIEW-ALERTS] Alerts fetched successfully');
    console.log(`📊 [VIEW-ALERTS] ${totalActiveAlerts} active alerts found`);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalActiveAlerts,
        criticalAlerts,
        errorAlerts,
        warningAlerts,
        infoAlerts,
        totalRules: alertRules.length,
        enabledRules: alertRules.filter((r: any) => r.enabled).length
      },
      alerts: alerts.map((alert: any) => ({
        id: alert.id,
        severity: alert.severity,
        service: alert.service,
        title: alert.title,
        description: alert.description,
        status: alert.status,
        startTime: alert.startTime,
        endTime: alert.endTime,
        duration: alert.duration,
        affectedUsers: alert.affectedUsers,
        alertSent: alert.alertSent,
        resolution: alert.resolution,
        createdAt: alert.createdAt,
        updatedAt: alert.updatedAt
      })),
      alertRules: alertRules.map((rule: any) => ({
        id: rule.id,
        name: rule.name,
        metric: rule.metric,
        threshold: rule.threshold,
        operator: rule.operator,
        severity: rule.severity,
        enabled: rule.enabled,
        cooldown: rule.cooldown,
        lastTriggered: rule.lastTriggered
      }))
    });
    
  } catch (error) {
    console.error('❌ [VIEW-ALERTS] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch alerts',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚨 [VIEW-ALERTS] Creating test alert...');
    
    // Динамічний імпорт prisma
    const { prisma } = await import('@/lib/monitoring');
    
    const body = await request.json();
    const { title, description, severity = 'info', service = 'test' } = body;
    
    // Create a test alert
    const testAlert = await prisma.incidentLogs.create({
      data: {
        severity,
        service,
        title: title || 'Test Alert',
        description: description || 'This is a test alert created from the dashboard',
        status: 'investigating',
        affectedUsers: 0,
        alertSent: false
      }
    });
    
    console.log('✅ [VIEW-ALERTS] Test alert created:', testAlert.id);
    
    return NextResponse.json({
      success: true,
      message: 'Test alert created successfully',
      alert: {
        id: testAlert.id,
        severity: testAlert.severity,
        service: testAlert.service,
        title: testAlert.title,
        description: testAlert.description,
        status: testAlert.status,
        startTime: testAlert.startTime,
        createdAt: testAlert.createdAt
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [VIEW-ALERTS] Create test alert error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create test alert',
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
