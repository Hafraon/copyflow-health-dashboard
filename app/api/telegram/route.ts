import { NextResponse } from 'next/server'
import { telegramAlerts, sendTelegramAlert } from '@/lib/telegram-alerts'

// Force dynamic for Prisma
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { action, ...params } = await request.json()
    
    switch (action) {
      case 'test':
        return await handleTestMessage()
        
      case 'send-alert':
        return await handleSendAlert(params)
        
      case 'status':
        return await handleGetStatus()
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
    
  } catch (error) {
    console.error('Telegram API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function handleTestMessage() {
  const startTime = Date.now()
  
  try {
    const success = await telegramAlerts.sendTestMessage()
    const processingTime = `${Date.now() - startTime}ms`
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Test message sent successfully',
        processingTime,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send test message',
        processingTime,
        status: telegramAlerts.getStatus()
      })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Test message failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      processingTime: `${Date.now() - startTime}ms`,
      status: telegramAlerts.getStatus()
    })
  }
}

async function handleSendAlert(params: any) {
  const { title, description, severity = 'warning', service = 'manual' } = params
  
  if (!title || !description) {
    return NextResponse.json(
      { success: false, error: 'Title and description are required' },
      { status: 400 }
    )
  }
  
  const startTime = Date.now()
  
  try {
    const success = await sendTelegramAlert(title, description, severity, service, {
      manual: true,
      timestamp: new Date().toISOString()
    })
    
    const processingTime = `${Date.now() - startTime}ms`
    
    return NextResponse.json({
      success,
      message: success ? 'Alert sent successfully' : 'Failed to send alert',
      processingTime,
      params: { title, description, severity, service }
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Alert sending failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      processingTime: `${Date.now() - startTime}ms`
    })
  }
}

async function handleGetStatus() {
  try {
    const status = telegramAlerts.getStatus()
    const isConfigured = telegramAlerts.isConfigured()
    
    return NextResponse.json({
      success: true,
      configured: isConfigured,
      status,
      environment: {
        hasBotToken: !!process.env.TELEGRAM_BOT_TOKEN,
        hasChatId: !!process.env.TELEGRAM_CHAT_ID,
        botTokenLength: process.env.TELEGRAM_BOT_TOKEN?.length || 0,
        chatIdLength: process.env.TELEGRAM_CHAT_ID?.length || 0
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get status',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// GET для отримання статусу
export async function GET() {
  return await handleGetStatus()
}
