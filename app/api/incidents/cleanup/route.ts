import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('[INCIDENTS-CLEANUP] Starting cleanup...');
    
    // Закрити всі incidents старіші за 24 години які не resolved
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const result = await prisma.incidentLogs.updateMany({
      where: {
        status: {
          not: 'resolved'
        },
        startTime: {
          lt: oneDayAgo
        }
      },
      data: {
        status: 'resolved',
        endTime: new Date(),
        resolution: 'Auto-resolved: Incident older than 24 hours'
      }
    });
    
    console.log('[INCIDENTS-CLEANUP] Closed incidents:', result.count);
    
    // Видалити дуже старі resolved incidents (старіші за 7 днів)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const deleted = await prisma.incidentLogs.deleteMany({
      where: {
        status: 'resolved',
        endTime: {
          lt: sevenDaysAgo
        }
      }
    });
    
    console.log('[INCIDENTS-CLEANUP] Deleted old resolved incidents:', deleted.count);
    
    return NextResponse.json({
      success: true,
      closed: result.count,
      deleted: deleted.count,
      message: `Closed ${result.count} old incidents, deleted ${deleted.count} resolved incidents`
    });
    
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[INCIDENTS-CLEANUP] Error:', message);
    
    return NextResponse.json({
      success: false,
      error: 'Cleanup failed',
      details: message
    }, { status: 500 });
  }
}
