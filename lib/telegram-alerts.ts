// CopyFlow Telegram Alert System
// Відправка сповіщень про критичні події в системі

export interface TelegramAlertConfig {
  botToken: string
  chatId: string
  enabled: boolean
}

export interface AlertMessage {
  title: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  service: string
  description: string
  timestamp: Date
  metadata?: any
}

// 🎨 EMOJI ДЛЯ РІЗНИХ ТИПІВ ALERTS
const ALERT_EMOJIS = {
  info: 'ℹ️',
  warning: '⚠️', 
  error: '❌',
  critical: '🚨'
} as const

const SEVERITY_COLORS = {
  info: '💙',
  warning: '💛',
  error: '🧡', 
  critical: '❤️'
} as const

export class TelegramAlertsService {
  private config: TelegramAlertConfig
  
  constructor() {
    this.config = {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      chatId: process.env.TELEGRAM_CHAT_ID || '',
      enabled: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)
    }
  }

  /**
   * Відправити alert повідомлення в Telegram
   */
  async sendAlert(alert: AlertMessage): Promise<boolean> {
    if (!this.config.enabled) {
      console.log('📱 Telegram alerts disabled - missing BOT_TOKEN or CHAT_ID')
      return false
    }

    try {
      const message = this.formatAlertMessage(alert)
      
      const response = await fetch(`https://api.telegram.org/bot${this.config.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.config.chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Telegram API error:', errorData)
        return false
      }

      console.log('✅ Telegram alert sent successfully')
      return true

    } catch (error) {
      console.error('🚨 Failed to send Telegram alert:', error)
      return false
    }
  }

  /**
   * Відправити тестове повідомлення для перевірки
   */
  async sendTestMessage(): Promise<boolean> {
    const testAlert: AlertMessage = {
      title: 'Test Alert',
      severity: 'info',
      service: 'telegram-test',
      description: 'Це тестове повідомлення для перевірки Telegram bot конфігурації',
      timestamp: new Date(),
      metadata: {
        test: true,
        dashboardVersion: '1.0.0'
      }
    }

    return await this.sendAlert(testAlert)
  }

  /**
   * Відправити звіт про стан системи
   */
  async sendHealthReport(healthData: any): Promise<boolean> {
    if (!this.config.enabled) return false

    try {
      const message = this.formatHealthReport(healthData)
      
      const response = await fetch(`https://api.telegram.org/bot${this.config.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.config.chatId,
          text: message,
          parse_mode: 'HTML'
        })
      })

      return response.ok

    } catch (error) {
      console.error('Failed to send health report:', error)
      return false
    }
  }

  /**
   * Форматування alert повідомлення для Telegram
   */
  private formatAlertMessage(alert: AlertMessage): string {
    const emoji = ALERT_EMOJIS[alert.severity]
    const colorEmoji = SEVERITY_COLORS[alert.severity]
    const time = alert.timestamp.toLocaleString('uk-UA', { 
      timeZone: 'Europe/Kiev',
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    let message = `${emoji} <b>CopyFlow Alert</b> ${colorEmoji}\n\n`
    message += `🏷️ <b>Сервіс:</b> ${alert.service}\n`
    message += `📋 <b>Проблема:</b> ${alert.title}\n`
    message += `📝 <b>Деталі:</b> ${alert.description}\n`
    message += `⏰ <b>Час:</b> ${time}\n`
    message += `🎯 <b>Рівень:</b> ${alert.severity.toUpperCase()}\n`

    // Додаткові метадані якщо є
    if (alert.metadata) {
      message += `\n📊 <b>Дані:</b>\n`
      
      // Показуємо найважливіші метрики
      if (alert.metadata.metric && alert.metadata.value) {
        message += `• ${alert.metadata.metric}: <code>${alert.metadata.value}</code>\n`
      }
      
      if (alert.metadata.threshold) {
        message += `• Поріг: <code>${alert.metadata.threshold}</code>\n`
      }
      
      if (alert.metadata.responseTime) {
        message += `• Час відгуку: <code>${alert.metadata.responseTime}ms</code>\n`
      }

      if (alert.metadata.errorMessage) {
        message += `• Помилка: <code>${alert.metadata.errorMessage}</code>\n`
      }
    }

    message += `\n🔗 <a href="${process.env.RAILWAY_STATIC_URL || 'http://localhost:3001'}">Відкрити Dashboard</a>`

    return message
  }

  /**
   * Форматування звіту про стан системи
   */
  private formatHealthReport(healthData: any): string {
    const time = new Date().toLocaleString('uk-UA', { 
      timeZone: 'Europe/Kiev',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })

    let message = `📊 <b>CopyFlow Health Report</b> 📊\n\n`
    message += `⏰ <b>Час:</b> ${time}\n`
    message += `🎯 <b>Health Score:</b> <code>${healthData.healthScore || 'N/A'}</code>\n\n`

    // Статус сервісів
    if (healthData.services) {
      message += `🔧 <b>Сервіси:</b>\n`
      healthData.services.forEach((service: any) => {
        const statusEmoji = service.status === 'operational' ? '✅' : 
                           service.status === 'degraded' ? '⚠️' : '❌'
        message += `${statusEmoji} ${service.service}: ${service.status}\n`
      })
      message += `\n`
    }

    // Ключові метрики
    if (healthData.metrics) {
      message += `📈 <b>Метрики:</b>\n`
      if (healthData.metrics.averageResponseTime) {
        message += `⏱️ Час відгуку: <code>${healthData.metrics.averageResponseTime}ms</code>\n`
      }
      if (healthData.metrics.successRate) {
        message += `✅ Успішність: <code>${healthData.metrics.successRate}%</code>\n`
      }
      if (healthData.metrics.activeUsers) {
        message += `👥 Активні користувачі: <code>${healthData.metrics.activeUsers}</code>\n`
      }
    }

    message += `\n🔗 <a href="${process.env.RAILWAY_STATIC_URL || 'http://localhost:3001'}">Детальний Dashboard</a>`

    return message
  }

  /**
   * Перевірити чи налаштовано Telegram
   */
  isConfigured(): boolean {
    return this.config.enabled
  }

  /**
   * Отримати статус конфігурації
   */
  getStatus(): { configured: boolean, botToken: boolean, chatId: boolean } {
    return {
      configured: this.config.enabled,
      botToken: !!this.config.botToken,
      chatId: !!this.config.chatId
    }
  }
}

// Експорт singleton instance
export const telegramAlerts = new TelegramAlertsService()

// Helper функція для швидкого відправлення alert
export async function sendTelegramAlert(
  title: string,
  description: string,
  severity: AlertMessage['severity'] = 'warning',
  service: string = 'system',
  metadata?: any
): Promise<boolean> {
  const alert: AlertMessage = {
    title,
    description,
    severity,
    service,
    timestamp: new Date(),
    metadata
  }

  return await telegramAlerts.sendAlert(alert)
}
