// Unified Alert System for CopyFlow Health Dashboard
import { emailAlertService, sendEmailAlert } from './email'
import { telegramAlertService, sendTelegramAlert, sendTelegramStatusUpdate } from './telegram'

export interface Alert {
  id?: string
  title: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  service: string
  metric?: string
  currentValue?: number
  threshold?: number
  timestamp?: Date
  channels?: ('email' | 'telegram')[]
}

export interface SystemStatus {
  status: 'operational' | 'degraded' | 'major'
  details?: string
  affectedServices?: string[]
}

class UnifiedAlertService {
  async sendAlert(alert: Alert): Promise<{ email: boolean; telegram: boolean }> {
    const channels = alert.channels || ['email', 'telegram']
    const results = { email: false, telegram: false }

    console.log(`🚨 Sending ${alert.severity} alert: ${alert.title}`)

    // Email notification
    if (channels.includes('email')) {
      try {
        results.email = await sendEmailAlert(
          alert.title,
          alert.message,
          alert.severity,
          alert.service,
          alert.metric,
          alert.currentValue,
          alert.threshold
        )
      } catch (error) {
        console.error('Failed to send email alert:', error)
      }
    }

    // Telegram notification
    if (channels.includes('telegram')) {
      try {
        results.telegram = await sendTelegramAlert(
          alert.title,
          alert.message,
          alert.severity,
          alert.service,
          alert.metric,
          alert.currentValue,
          alert.threshold
        )
      } catch (error) {
        console.error('Failed to send Telegram alert:', error)
      }
    }

    // Log results
    const successChannels = Object.entries(results)
      .filter(([_, success]) => success)
      .map(([channel, _]) => channel)

    if (successChannels.length > 0) {
      console.log(`✅ Alert sent successfully via: ${successChannels.join(', ')}`)
    } else {
      console.error('❌ Failed to send alert via any channel')
    }

    return results
  }

  async sendSystemStatusUpdate(status: SystemStatus): Promise<{ email: boolean; telegram: boolean }> {
    const results = { email: false, telegram: false }

    const statusEmoji = {
      operational: '✅',
      degraded: '⚠️',
      major: '🚨'
    }

    const title = `${statusEmoji[status.status]} System Status: ${status.status.toUpperCase()}`
    let message = `CopyFlow system status has changed to: ${status.status}`

    if (status.details) {
      message += `\n\nDetails: ${status.details}`
    }

    if (status.affectedServices && status.affectedServices.length > 0) {
      message += `\n\nAffected services: ${status.affectedServices.join(', ')}`
    }

    const severity = status.status === 'operational' ? 'info' : 
                    status.status === 'degraded' ? 'warning' : 'critical'

    // Send as regular alert via email
    try {
      results.email = await sendEmailAlert(
        title,
        message,
        severity,
        'system'
      )
    } catch (error) {
      console.error('Failed to send email status update:', error)
    }

    // Send as status update via Telegram
    try {
      results.telegram = await sendTelegramStatusUpdate(status.status, status.details)
    } catch (error) {
      console.error('Failed to send Telegram status update:', error)
    }

    return results
  }

  async testAllChannels(): Promise<{ email: boolean; telegram: boolean }> {
    console.log('🧪 Testing all alert channels...')

    const results = { email: false, telegram: false }

    // Test email
    try {
      results.email = await emailAlertService.testConnection()
    } catch (error) {
      console.error('Email test failed:', error)
    }

    // Test Telegram
    try {
      results.telegram = await telegramAlertService.testConnection()
    } catch (error) {
      console.error('Telegram test failed:', error)
    }

    console.log('🧪 Test results:', results)
    return results
  }

  // Predefined alert templates
  async sendResponseTimeAlert(currentTime: number, threshold: number, service: string): Promise<void> {
    await this.sendAlert({
      title: 'High Response Time Detected',
      message: `Response time for ${service} has exceeded the warning threshold. This may indicate performance degradation or high system load.`,
      severity: currentTime > threshold * 2 ? 'critical' : 'warning',
      service,
      metric: 'responseTime',
      currentValue: currentTime,
      threshold
    })
  }

  async sendSuccessRateAlert(currentRate: number, threshold: number, service: string): Promise<void> {
    await this.sendAlert({
      title: 'Low Success Rate Detected',
      message: `Success rate for ${service} has dropped below the warning threshold. Users may be experiencing failures.`,
      severity: currentRate < threshold - 10 ? 'critical' : 'warning',
      service,
      metric: 'successRate',
      currentValue: currentRate,
      threshold
    })
  }

  async sendServiceDownAlert(service: string, error?: string): Promise<void> {
    await this.sendAlert({
      title: `Service Down: ${service}`,
      message: `${service} is currently unavailable. ${error ? `Error: ${error}` : 'Health check failed.'}`,
      severity: 'critical',
      service
    })
  }

  async sendServiceRecoveredAlert(service: string, downtime?: string): Promise<void> {
    await this.sendAlert({
      title: `Service Recovered: ${service}`,
      message: `${service} has recovered and is now operational. ${downtime ? `Downtime: ${downtime}` : ''}`,
      severity: 'info',
      service
    })
  }

  async sendMaintenanceAlert(service: string, duration: string, startTime: Date): Promise<void> {
    await this.sendAlert({
      title: `Scheduled Maintenance: ${service}`,
      message: `Scheduled maintenance for ${service} will begin at ${startTime.toLocaleString('uk-UA', { timeZone: 'Europe/Kiev' })} and is expected to last ${duration}.`,
      severity: 'info',
      service,
      channels: ['email', 'telegram']
    })
  }
}

// Export singleton instance
export const alertService = new UnifiedAlertService()

// Export individual services for direct access
export { emailAlertService, telegramAlertService }

// Export helper functions
export { sendEmailAlert, sendTelegramAlert, sendTelegramStatusUpdate }

// Quick helper for common alerts
export async function quickAlert(
  title: string, 
  message: string, 
  severity: 'info' | 'warning' | 'error' | 'critical' = 'info'
): Promise<void> {
  await alertService.sendAlert({
    title,
    message,
    severity,
    service: 'system'
  })
}

// Alert severity helpers
export const AlertSeverity = {
  INFO: 'info' as const,
  WARNING: 'warning' as const,
  ERROR: 'error' as const,
  CRITICAL: 'critical' as const
}

export const SystemStatus = {
  OPERATIONAL: 'operational' as const,
  DEGRADED: 'degraded' as const,
  MAJOR: 'major' as const
}
