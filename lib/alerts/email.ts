// Email Alert System for CopyFlow Health Dashboard
import nodemailer from 'nodemailer'

interface EmailAlert {
  subject: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  service: string
  metric?: string
  currentValue?: number
  threshold?: number
}

class EmailAlertService {
  private transporter: nodemailer.Transporter | null = null

  constructor() {
    this.initializeTransporter()
  }

  private initializeTransporter() {
    try {
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️ Email alerts not configured - missing SMTP credentials')
        return
      }

      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      })

      console.log('✅ Email alerts configured successfully')
    } catch (error) {
      console.error('❌ Failed to configure email alerts:', error)
    }
  }

  async sendAlert(alert: EmailAlert): Promise<boolean> {
    if (!this.transporter) {
      console.warn('⚠️ Email transporter not available')
      return false
    }

    try {
      const htmlContent = this.generateEmailHTML(alert)
      
      const mailOptions = {
        from: process.env.ALERT_EMAIL_FROM || process.env.SMTP_USER,
        to: process.env.ALERT_EMAIL_TO,
        subject: `[CopyFlow Alert] ${this.getSeverityEmoji(alert.severity)} ${alert.subject}`,
        html: htmlContent,
        text: this.generatePlainText(alert)
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('✅ Email alert sent successfully:', result.messageId)
      return true
      
    } catch (error) {
      console.error('❌ Failed to send email alert:', error)
      return false
    }
  }

  private generateEmailHTML(alert: EmailAlert): string {
    const severityColor = this.getSeverityColor(alert.severity)
    const timestamp = new Date().toLocaleString('uk-UA', { 
      timeZone: 'Europe/Kiev',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: ${severityColor}; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .alert-info { background: #f1f5f9; border-left: 4px solid ${severityColor}; padding: 15px; margin: 20px 0; }
    .metric-value { font-size: 24px; font-weight: bold; color: ${severityColor}; }
    .timestamp { color: #64748b; font-size: 14px; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
    .btn { background: ${severityColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${this.getSeverityEmoji(alert.severity)} CopyFlow System Alert</h1>
      <p style="margin: 0; opacity: 0.9;">${alert.subject}</p>
    </div>
    
    <div class="content">
      <div class="alert-info">
        <h3 style="margin-top: 0; color: #1e293b;">Alert Details</h3>
        <p><strong>Service:</strong> ${alert.service}</p>
        <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
        ${alert.metric ? `<p><strong>Metric:</strong> ${alert.metric}</p>` : ''}
        ${alert.currentValue ? `<p><strong>Current Value:</strong> <span class="metric-value">${alert.currentValue}${alert.metric?.includes('Time') ? 'ms' : alert.metric?.includes('Rate') ? '%' : ''}</span></p>` : ''}
        ${alert.threshold ? `<p><strong>Threshold:</strong> ${alert.threshold}${alert.metric?.includes('Time') ? 'ms' : alert.metric?.includes('Rate') ? '%' : ''}</p>` : ''}
      </div>
      
      <h3>Description</h3>
      <p>${alert.message}</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="http://localhost:3001" class="btn">View Dashboard</a>
      </div>
      
      <p class="timestamp">
        <strong>Timestamp:</strong> ${timestamp} (Kyiv time)
      </p>
    </div>
    
    <div class="footer">
      <p>CopyFlow Health Dashboard | Automated monitoring system</p>
      <p>This is an automated message. Do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `
  }

  private generatePlainText(alert: EmailAlert): string {
    const timestamp = new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kiev' })
    
    return `
CopyFlow System Alert - ${alert.severity.toUpperCase()}

Subject: ${alert.subject}
Service: ${alert.service}
Severity: ${alert.severity}
${alert.metric ? `Metric: ${alert.metric}` : ''}
${alert.currentValue ? `Current Value: ${alert.currentValue}` : ''}
${alert.threshold ? `Threshold: ${alert.threshold}` : ''}

Description:
${alert.message}

Timestamp: ${timestamp} (Kyiv time)

View Dashboard: http://localhost:3001

---
CopyFlow Health Dashboard
Automated monitoring system
    `
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

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return '#dc2626'  // red-600
      case 'error': return '#ef4444'     // red-500
      case 'warning': return '#f59e0b'   // amber-500
      case 'info': return '#3b82f6'      // blue-500
      default: return '#6366f1'          // indigo-500
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) return false

    try {
      await this.transporter.verify()
      console.log('✅ Email connection test successful')
      return true
    } catch (error) {
      console.error('❌ Email connection test failed:', error)
      return false
    }
  }
}

// Експорт singleton instance
export const emailAlertService = new EmailAlertService()

// Helper функція для швидкої відправки алертів
export async function sendEmailAlert(
  subject: string,
  message: string,
  severity: 'info' | 'warning' | 'error' | 'critical' = 'warning',
  service: string = 'system',
  metric?: string,
  currentValue?: number,
  threshold?: number
): Promise<boolean> {
  return emailAlertService.sendAlert({
    subject,
    message,
    severity,
    service,
    metric,
    currentValue,
    threshold
  })
}
