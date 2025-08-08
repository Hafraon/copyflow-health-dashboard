// Telegram Alert System for CopyFlow Health Dashboard
import TelegramBot from 'node-telegram-bot-api'

interface TelegramAlert {
  title: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  service: string
  metric?: string
  currentValue?: number
  threshold?: number
}

class TelegramAlertService {
  private bot: TelegramBot | null = null
  private chatId: string | null = null

  constructor() {
    this.initializeBot()
  }

  private initializeBot() {
    try {
      const token = process.env.TELEGRAM_BOT_TOKEN
      const chatId = process.env.TELEGRAM_CHAT_ID

      if (!token || !chatId) {
        console.warn('⚠️ Telegram alerts not configured - missing bot token or chat ID')
        return
      }

      this.bot = new TelegramBot(token, { polling: false })
      this.chatId = chatId

      console.log('✅ Telegram alerts configured successfully')
    } catch (error) {
      console.error('❌ Failed to configure Telegram alerts:', error)
    }
  }

  async sendAlert(alert: TelegramAlert): Promise<boolean> {
    if (!this.bot || !this.chatId) {
      console.warn('⚠️ Telegram bot not available')
      return false
    }

    try {
      const message = this.formatTelegramMessage(alert)
      
      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })

      console.log('✅ Telegram alert sent successfully')
      return true
      
    } catch (error) {
      console.error('❌ Failed to send Telegram alert:', error)
      return false
    }
  }

  private formatTelegramMessage(alert: TelegramAlert): string {
    const emoji = this.getSeverityEmoji(alert.severity)
    const timestamp = new Date().toLocaleString('uk-UA', { 
      timeZone: 'Europe/Kiev',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })

    let message = `${emoji} *CopyFlow System Alert*\n\n`
    message += `🚨 *${alert.title}*\n\n`
    
    message += `📊 *Details:*\n`
    message += `• Service: \`${alert.service}\`\n`
    message += `• Severity: \`${alert.severity.toUpperCase()}\`\n`
    
    if (alert.metric) {
      message += `• Metric: \`${alert.metric}\`\n`
    }
    
    if (alert.currentValue !== undefined) {
      const unit = this.getMetricUnit(alert.metric)
      message += `• Current Value: \`${alert.currentValue}${unit}\`\n`
    }
    
    if (alert.threshold !== undefined) {
      const unit = this.getMetricUnit(alert.metric)
      message += `• Threshold: \`${alert.threshold}${unit}\`\n`
    }
    
    message += `• Time: \`${timestamp}\` (Kyiv)\n\n`
    
    message += `📝 *Description:*\n${alert.message}\n\n`
    
    message += `🔗 [View Dashboard](http://localhost:3001)\n`
    message += `🔧 [Check System Health](http://localhost:3001/api/health)`

    return message
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical': return '🚨'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      default: return '📊'
    }
  }

  private getMetricUnit(metric?: string): string {
    if (!metric) return ''
    
    if (metric.toLowerCase().includes('time')) return 'ms'
    if (metric.toLowerCase().includes('rate') || metric.toLowerCase().includes('percent')) return '%'
    if (metric.toLowerCase().includes('count') || metric.toLowerCase().includes('number')) return ''
    
    return ''
  }

  async sendStatusUpdate(status: 'operational' | 'degraded' | 'major', details?: string): Promise<boolean> {
    if (!this.bot || !this.chatId) return false

    try {
      const emoji = status === 'operational' ? '✅' : status === 'degraded' ? '⚠️' : '🚨'
      const statusText = status.charAt(0).toUpperCase() + status.slice(1)
      
      let message = `${emoji} *CopyFlow Status Update*\n\n`
      message += `System Status: \`${statusText}\`\n`
      
      if (details) {
        message += `\n📝 Details: ${details}\n`
      }
      
      message += `\n🕐 ${new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kiev' })} (Kyiv)`
      
      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'Markdown'
      })

      return true
    } catch (error) {
      console.error('❌ Failed to send status update:', error)
      return false
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.bot || !this.chatId) return false

    try {
      await this.bot.sendMessage(this.chatId, 
        '🧪 *CopyFlow Health Dashboard Test*\n\nTelegram notifications are working correctly!\n\n✅ Connection test successful', 
        { parse_mode: 'Markdown' }
      )
      console.log('✅ Telegram connection test successful')
      return true
    } catch (error) {
      console.error('❌ Telegram connection test failed:', error)
      return false
    }
  }

  // Метод для налаштування команд бота
  async setupBotCommands(): Promise<void> {
    if (!this.bot) return

    try {
      const commands = [
        { command: 'status', description: 'Get current system status' },
        { command: 'health', description: 'Check system health' },
        { command: 'metrics', description: 'View key metrics' },
        { command: 'alerts', description: 'List active alerts' }
      ]

      await this.bot.setMyCommands(commands)
      console.log('✅ Telegram bot commands configured')
    } catch (error) {
      console.error('❌ Failed to setup bot commands:', error)
    }
  }
}

// Експорт singleton instance
export const telegramAlertService = new TelegramAlertService()

// Helper функція для швидкої відправки алертів
export async function sendTelegramAlert(
  title: string,
  message: string,
  severity: 'info' | 'warning' | 'error' | 'critical' = 'warning',
  service: string = 'system',
  metric?: string,
  currentValue?: number,
  threshold?: number
): Promise<boolean> {
  return telegramAlertService.sendAlert({
    title,
    message,
    severity,
    service,
    metric,
    currentValue,
    threshold
  })
}

// Helper для відправки статусних оновлень
export async function sendTelegramStatusUpdate(
  status: 'operational' | 'degraded' | 'major',
  details?: string
): Promise<boolean> {
  return telegramAlertService.sendStatusUpdate(status, details)
}
