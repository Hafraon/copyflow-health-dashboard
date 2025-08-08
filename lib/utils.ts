// Utility functions for CopyFlow Health Dashboard

export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`
  }
  
  const seconds = Math.floor(milliseconds / 1000)
  if (seconds < 60) {
    return `${seconds}s`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'operational': return '#10b981' // green-500
    case 'degraded': return '#f59e0b'    // amber-500
    case 'partial': return '#f97316'     // orange-500
    case 'major': return '#ef4444'       // red-500
    case 'maintenance': return '#6b7280' // gray-500
    default: return '#6b7280'
  }
}

export function getStatusIcon(status: string): string {
  switch (status) {
    case 'operational': return '🟢'
    case 'degraded': return '🟡'
    case 'partial': return '🟠'
    case 'major': return '🔴'
    case 'maintenance': return '🔵'
    default: return '⚪'
  }
}

export function calculateUptime(incidents: any[]): number {
  // Simplified uptime calculation
  const now = Date.now()
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000) // 30 days
  
  const recentIncidents = incidents.filter(incident => 
    new Date(incident.startTime).getTime() > thirtyDaysAgo
  )
  
  const totalDowntime = recentIncidents.reduce((total, incident) => {
    if (incident.endTime) {
      const downtime = new Date(incident.endTime).getTime() - new Date(incident.startTime).getTime()
      return total + downtime
    }
    return total
  }, 0)
  
  const totalTime = 30 * 24 * 60 * 60 * 1000 // 30 days in ms
  const uptime = ((totalTime - totalDowntime) / totalTime) * 100
  
  return Math.max(0, Math.min(100, uptime))
}

export function generateIncidentId(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  
  return `INC-${year}${month}${day}-${randomNum}`
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const target = new Date(date)
  const diffMs = now.getTime() - target.getTime()
  
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffSeconds < 60) {
    return diffSeconds <= 5 ? 'Just now' : `${diffSeconds}s ago`
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else if (diffDays < 7) {
    return `${diffDays}d ago`
  } else {
    return target.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: diffDays > 365 ? 'numeric' : undefined
    })
  }
}

export function isHealthy(status: string): boolean {
  return status === 'operational'
}

export function isDegraded(status: string): boolean {
  return ['degraded', 'partial'].includes(status)
}

export function isDown(status: string): boolean {
  return status === 'major'
}

export function generateHealthScore(services: any[]): number {
  if (services.length === 0) return 100
  
  let score = 0
  
  services.forEach(service => {
    switch (service.status) {
      case 'operational':
        score += 100
        break
      case 'degraded':
        score += 70
        break
      case 'partial':
        score += 40
        break
      case 'major':
        score += 0
        break
      case 'maintenance':
        score += 85
        break
      default:
        score += 50
    }
  })
  
  return Math.round(score / services.length)
}

export function shouldAlert(metric: string, value: number, thresholds: any): boolean {
  const threshold = thresholds[metric]
  if (!threshold) return false
  
  switch (metric) {
    case 'responseTime':
      return value > threshold.warning
    case 'successRate':
      return value < threshold.warning
    case 'errorRate':
      return value > threshold.warning
    default:
      return false
  }
}

export function getAlertSeverity(metric: string, value: number, thresholds: any): 'warning' | 'critical' {
  const threshold = thresholds[metric]
  if (!threshold) return 'warning'
  
  switch (metric) {
    case 'responseTime':
      return value > threshold.critical ? 'critical' : 'warning'
    case 'successRate':
      return value < threshold.critical ? 'critical' : 'warning'
    case 'errorRate':
      return value > threshold.critical ? 'critical' : 'warning'
    default:
      return 'warning'
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Environment helpers
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

export function getBaseUrl(): string {
  if (isProduction()) {
    return process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'https://copyflow-health.railway.app'
  }
  return `http://localhost:${process.env.PORT || 3001}`
}

// API helpers
export function createApiResponse<T>(data: T, success: boolean = true) {
  return {
    success,
    data,
    timestamp: new Date().toISOString()
  }
}

export function createErrorResponse(error: string, status: number = 500) {
  return {
    success: false,
    error,
    timestamp: new Date().toISOString(),
    status
  }
}
