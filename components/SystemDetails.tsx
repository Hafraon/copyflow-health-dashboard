'use client'

import { useState, useEffect } from 'react'
import { Server, Database, Zap, Globe, Shield, CreditCard, RefreshCw, AlertCircle } from 'lucide-react'

interface SystemDetailProps {
  icon: React.ReactNode
  title: string
  status: 'online' | 'offline' | 'degraded'
  details: Array<{ label: string; value: string; status?: 'good' | 'warning' | 'error' }>
  lastUpdate: string
}

function SystemDetailCard({ icon, title, status, details, lastUpdate }: SystemDetailProps) {
  const statusColors = {
    online: 'text-green-600 bg-green-50 border-green-200',
    offline: 'text-red-600 bg-red-50 border-red-200',
    degraded: 'text-yellow-600 bg-yellow-50 border-yellow-200'
  }

  const statusText = {
    online: 'Online',
    offline: 'Offline', 
    degraded: 'Degraded'
  }

  const iconMap = {
    'Server': <Server className=\"w-5 h-5\" />,
    'Database': <Database className=\"w-5 h-5\" />,
    'Zap': <Zap className=\"w-5 h-5\" />,
    'Globe': <Globe className=\"w-5 h-5\" />,
    'Shield': <Shield className=\"w-5 h-5\" />,
    'CreditCard': <CreditCard className=\"w-5 h-5\" />
  }

  return (
    <div className={`bg-white rounded-lg border-l-4 border shadow-sm p-6 ${statusColors[status]}`}>
      <div className=\"flex items-center justify-between mb-4\">
        <div className=\"flex items-center space-x-3\">
          <div className={`p-2 rounded-lg ${status === 'online' ? 'bg-green-100' : status === 'degraded' ? 'bg-yellow-100' : 'bg-red-100'}`}>
            {typeof icon === 'string' ? iconMap[icon as keyof typeof iconMap] : icon}
          </div>
          <div>
            <h3 className=\"font-semibold text-gray-900\">{title}</h3>
            <span className={`text-sm font-medium ${
              status === 'online' ? 'text-green-600' :
              status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {statusText[status]}
            </span>
          </div>
        </div>
        <div className=\"text-xs text-gray-500\">{lastUpdate}</div>
      </div>
      
      <div className=\"space-y-3\">
        {details.map((detail, index) => (
          <div key={index} className=\"flex justify-between items-center\">
            <span className=\"text-sm text-gray-600\">{detail.label}</span>
            <span className={`text-sm font-medium ${
              detail.status === 'good' ? 'text-green-600' :
              detail.status === 'warning' ? 'text-yellow-600' :
              detail.status === 'error' ? 'text-red-600' :
              'text-gray-900'
            }`}>
              {detail.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SystemDetails() {
  const [systemData, setSystemData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchSystemData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/system-details')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setSystemData(data.data)
        setLastRefresh(new Date())
      } else {
        throw new Error(data.error || 'Failed to fetch system data')
      }
      
    } catch (err) {
      console.error('Error fetching system data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      
      // Fallback до базових моків якщо API недоступне
      setSystemData({
        systemComponents: [
          {
            icon: 'Server',
            title: 'Application Server',
            status: 'offline',
            details: [
              { label: 'CPU Usage', value: 'N/A', status: 'error' },
              { label: 'Memory Usage', value: 'N/A', status: 'error' },
              { label: 'Disk Space', value: 'N/A', status: 'error' },
              { label: 'Active Connections', value: 'N/A', status: 'error' }
            ],
            lastUpdate: 'Failed to update'
          }
        ],
        summary: {
          onlineComponents: 0,
          degradedComponents: 0,
          totalComponents: 6,
          overallUptime: '0.0',
          avgResponseTime: 'N/A'
        }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemData()
    
    // Auto-refresh кожні 30 секунд
    const interval = setInterval(fetchSystemData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const handleManualRefresh = () => {
    fetchSystemData()
  }

  const formatLastRefresh = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    
    if (diffSec < 60) return `${diffSec}s ago`
    if (diffMin < 60) return `${diffMin}m ago`
    return date.toLocaleTimeString()
  }

  if (loading && !systemData) {
    return (
      <div className=\"flex items-center justify-center py-12\">
        <div className=\"flex items-center space-x-3\">
          <RefreshCw className=\"w-5 h-5 animate-spin text-blue-600\" />
          <span className=\"text-gray-600\">Loading system data...</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className=\"mb-6\">
        <div className=\"flex items-center justify-between\">
          <div>
            <h3 className=\"text-lg font-semibold text-gray-900\">System Components</h3>
            <p className=\"text-sm text-gray-600\">
              Real-time status of all system components and dependencies
              {error && (
                <span className=\"text-red-600 ml-2\">
                  <AlertCircle className=\"w-4 h-4 inline mr-1\" />
                  API Error - Showing fallback data
                </span>
              )}
            </p>
          </div>
          <div className=\"flex items-center space-x-3\">
            <span className=\"text-xs text-gray-500\">
              Last updated: {formatLastRefresh(lastRefresh)}
            </span>
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className=\"flex items-center space-x-1 px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50\"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>
      
      {systemData && (
        <>
          <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
            {systemData.systemComponents.map((component: any, index: number) => (
              <SystemDetailCard key={index} {...component} />
            ))}
          </div>
          
          {/* System Summary */}
          <div className=\"mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200\">
            <h4 className=\"font-semibold text-gray-900 mb-4\">System Health Summary</h4>
            <div className=\"grid grid-cols-1 md:grid-cols-4 gap-4\">
              <div className=\"text-center\">
                <div className=\"text-2xl font-bold text-green-600\">
                  {systemData.summary.onlineComponents}/{systemData.summary.totalComponents}
                </div>
                <div className=\"text-sm text-gray-600\">Components Online</div>
              </div>
              <div className=\"text-center\">
                <div className=\"text-2xl font-bold text-yellow-600\">
                  {systemData.summary.degradedComponents}/{systemData.summary.totalComponents}
                </div>
                <div className=\"text-sm text-gray-600\">Degraded Services</div>
              </div>
              <div className=\"text-center\">
                <div className=\"text-2xl font-bold text-blue-600\">
                  {systemData.summary.overallUptime}%
                </div>
                <div className=\"text-sm text-gray-600\">Overall Uptime</div>
              </div>
              <div className=\"text-center\">
                <div className=\"text-2xl font-bold text-purple-600\">
                  {systemData.summary.avgResponseTime}
                </div>
                <div className=\"text-sm text-gray-600\">Avg Response</div>
              </div>
            </div>
          </div>
          
          {error && (
            <div className=\"mt-6 bg-red-50 border border-red-200 rounded-lg p-4\">
              <div className=\"flex items-center space-x-2\">
                <AlertCircle className=\"w-5 h-5 text-red-600\" />
                <div>
                  <h4 className=\"font-medium text-red-900\">API Connection Issue</h4>
                  <p className=\"text-sm text-red-700 mt-1\">{error}</p>
                  <p className=\"text-xs text-red-600 mt-2\">
                    Displaying cached/fallback data. Click refresh to retry.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
