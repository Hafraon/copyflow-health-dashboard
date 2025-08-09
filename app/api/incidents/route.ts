import { NextResponse } from 'next/server'
import { prisma } from '@/lib/monitoring'

// Force dynamic for real-time data
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const days = parseInt(searchParams.get('days') || '30')
    
    const startTime = Date.now()
    
    // Calculate date range
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - days)
    
    // Fetch incidents from database
    const incidentLogs = await prisma.incidentLogs.findMany({
      where: {
        startTime: {
          gte: dateFrom
        }
      },
      orderBy: [
        { status: 'asc' }, // Active incidents first
        { startTime: 'desc' } // Then by newest
      ],
      take: limit
    })
    
    // Transform to frontend format
    const incidents = incidentLogs.map(log => ({
      id: log.id,
      title: log.title,
      description: log.description || '',
      severity: log.severity as 'info' | 'warning' | 'error' | 'critical',
      status: log.status as 'investigating' | 'identified' | 'monitoring' | 'resolved',
      startTime: log.startTime.toISOString(),
      endTime: log.endTime?.toISOString(),
      duration: log.duration ? `${log.duration} minutes` : undefined,
      affectedServices: [log.service] // Single service for now, can be expanded
    }))
    
    const processingTime = Date.now() - startTime
    
    // Calculate summary
    const summary = {
      total: incidents.length,
      active: incidents.filter(i => i.status !== 'resolved').length,
      resolved: incidents.filter(i => i.status === 'resolved').length,
      critical: incidents.filter(i => i.severity === 'critical').length,
      byStatus: {
        investigating: incidents.filter(i => i.status === 'investigating').length,
        identified: incidents.filter(i => i.status === 'identified').length, 
        monitoring: incidents.filter(i => i.status === 'monitoring').length,
        resolved: incidents.filter(i => i.status === 'resolved').length
      },
      bySeverity: {
        info: incidents.filter(i => i.severity === 'info').length,
        warning: incidents.filter(i => i.severity === 'warning').length,
        error: incidents.filter(i => i.severity === 'error').length,
        critical: incidents.filter(i => i.severity === 'critical').length
      }
    }
    
    return NextResponse.json({
      success: true,
      incidents,
      summary,
      meta: {
        limit,
        days,
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Incidents API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch incidents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST endpoint to create new incident (for testing or manual reporting)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, severity = 'warning', service = 'manual', status = 'investigating' } = body
    
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      )
    }
    
    // Create incident
    const incident = await prisma.incidentLogs.create({
      data: {
        title,
        description: description || `Manual incident: ${title}`,
        severity,
        service,
        status,
        startTime: new Date(),
        affectedUsers: 0,
        alertSent: false
      }
    })
    
    return NextResponse.json({
      success: true,
      incident: {
        id: incident.id,
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        status: incident.status,
        startTime: incident.startTime.toISOString(),
        service: incident.service
      },
      message: 'Incident created successfully'
    })

  } catch (error) {
    console.error('Create incident error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create incident',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
