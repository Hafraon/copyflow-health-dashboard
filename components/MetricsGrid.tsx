'use client'

import { useState, useEffect } from 'react'
import { ArrowUp, ArrowDown, Clock, Database, Zap, CheckCircle, AlertTriangle, Activity, Loader2 } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    trend: 'up' | 'down'
    timeframe: string
  }
  status?: 'good' | 'warning' | 'critical'
  icon: React.ReactNode
  description: string
}

function MetricCard({ title, value, change, status = 'good', icon, description }: MetricCardProps) {
  const statusColors = {
    good: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    critical: 'text-red-600 bg-red-50 border-red-200'
  }

  return (
    <div className={`metric-card border-l-4 ${statusColors[status]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            status === 'good' ? 'bg-green-100' : 
            status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
          }`}>
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        {change && (
          <div className={`flex items-center space-x-1 text-sm ${
            change.trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {change.trend === 'up' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            <span className="font-medium">{Math.abs(change.value)}%</span>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-500 mt-2">{description}</p>
      {change && (
        <p className="text-xs text-gray-400 mt-1">{change.timeframe}</p>
      )}
    </div>
  )
}

export default function MetricsGrid() {
  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<any>(null)
  const [showResults, setShowResults] = useState(false)
  const [realMetrics, setRealMetrics] = useState<any>(null)
  const [metricsLoading, setMetricsLoading] = useState(true)

  // Fetch real metrics on component mount
  useEffect(() => {
    fetchRealMetrics()
    
    // Update every 30 seconds
    const interval = setInterval(fetchRealMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchRealMetrics = async () => {
    try {
      setMetricsLoading(true)
      
      const [serviceResponse, systemResponse] = await Promise.allSettled([
        fetch('/api/service-status'),
        fetch('/api/system-details')
      ])
      
      let services = []
      let systemData = null
      
      if (serviceResponse.status === 'fulfilled' && serviceResponse.value.ok) {
        const data = await serviceResponse.value.json()
        services = data.services || []
      }
      
      if (systemResponse.status === 'fulfilled' && systemResponse.value.ok) {
        const data = await systemResponse.value.json()
        systemData = data.data
      }
      
      setRealMetrics({ services, systemData })
    } catch (error) {
      console.error('Failed to fetch real metrics:', error)
    } finally {
      setMetricsLoading(false)
    }
  }

  // Calculate metrics from real data
  const getMetrics = () => {
    if (!realMetrics) {
      return [
        {
          title: 'System Status',
          value: 'Loading...',
          status: 'warning' as const,
          icon: <Activity className="w-5 h-5 text-gray-600" />,
          description: 'Fetching real-time system status'
        }
      ]
    }
    
    const { services, systemData } = realMetrics
    
    // Database metrics
    const dbMetrics = systemData?.systemComponents?.find((c: any) => c.title === 'Database Cluster')
    const dbResponseTime = dbMetrics?.details?.find((d: any) => d.label === 'Query Time')?.value || 'N/A'
    
    // OpenAI metrics
    const openaiMetrics = systemData?.systemComponents?.find((c: any) => c.title === 'OpenAI Services')
    const openaiLatency = openaiMetrics?.details?.find((d: any) => d.label === 'Average Latency')?.value || 'N/A'
    
    // Service availability
    const operationalServices = services?.filter((s: any) => s.status === 'operational').length || 0
    const totalServices = services?.length || 0
    const availability = totalServices > 0 ? ((operationalServices / totalServices) * 100).toFixed(1) : '0.0'
    
    return [
      {
        title: 'Database Response',
        value: dbResponseTime,
        status: dbResponseTime !== 'N/A' && parseInt(dbResponseTime) > 100 ? 'warning' : 'good' as const,
        icon: <Database className="w-5 h-5 text-blue-600" />,
        description: 'PostgreSQL query response time'
      },
      {
        title: 'OpenAI Latency', 
        value: openaiLatency,
        status: openaiLatency !== 'N/A' && parseInt(openaiLatency) > 2000 ? 'warning' : 'good' as const,
        icon: <Zap className="w-5 h-5 text-purple-600" />,
        description: 'AI assistant response time'
      },
      {
        title: 'Service Availability',
        value: `${availability}%`,
        status: parseFloat(availability) < 100 ? 'warning' : 'good' as const,
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
        description: `${operationalServices}/${totalServices} services operational`
      },
      {
        title: 'System Health',
        value: systemData?.summary?.overallUptime ? `${systemData.summary.overallUptime}%` : 'N/A',
        status: systemData?.summary?.overallUptime && parseFloat(systemData.summary.overallUptime) < 95 ? 'warning' : 'good' as const,
        icon: <Activity className="w-5 h-5 text-indigo-600" />,
        description: 'Overall system health score'
      }
    ]
  }

  const handleForceHealthCheck = async () => {
    setLoading('health')
    setResults(null)
    try {
      const response = await fetch('/api/actions/force-health-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      setResults({ type: 'health', data })
      setShowResults(true)
      
      // Refresh metrics after health check
      fetchRealMetrics()
    } catch (error) {
      setResults({ 
        type: 'health', 
        data: { 
          success: false, 
          error: 'Failed to perform health check',
          details: error instanceof Error ? error.message : 'Network error'
        } 
      })
      setShowResults(true)
    } finally {
      setLoading(null)
    }
  }

  const handleTestAssistants = async () => {
    setLoading('assistants')
    setResults(null)
    try {
      const response = await fetch('/api/actions/test-assistants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      setResults({ type: 'assistants', data })
      setShowResults(true)
    } catch (error) {
      setResults({ 
        type: 'assistants', 
        data: { 
          success: false, 
          error: 'Failed to test assistants',
          details: error instanceof Error ? error.message : 'Network error'
        } 
      })
      setShowResults(true)
    } finally {
      setLoading(null)
    }
  }

  const handleViewAlerts = async () => {
    setLoading('alerts')
    setResults(null)
    try {
      const response = await fetch('/api/actions/view-alerts?limit=10')
      const data = await response.json()
      setResults({ type: 'alerts', data })
      setShowResults(true)
    } catch (error) {
      setResults({ 
        type: 'alerts', 
        data: { 
          success: false, 
          error: 'Failed to fetch alerts',
          details: error instanceof Error ? error.message : 'Network error'
        } 
      })
      setShowResults(true)
    } finally {
      setLoading(null)
    }
  }

  const handleTestTelegram = async () => {
    setLoading('telegram')
    setResults(null)
    try {
      const response = await fetch('/api/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'test' })
      })
      
      const data = await response.json()
      setResults({ type: 'telegram', data })
      setShowResults(true)
    } catch (error) {
      setResults({ 
        type: 'telegram', 
        data: { 
          success: false, 
          error: 'Failed to test Telegram bot',
          details: error instanceof Error ? error.message : 'Network error'
        } 
      })
      setShowResults(true)
    } finally {
      setLoading(null)
    }
  }

  const formatResults = () => {
    if (!results) return null

    const { type, data } = results

    if (!data.success) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-900 mb-2">❌ {data.error}</h4>
          <p className="text-sm text-red-700">{data.details}</p>
        </div>
      )
    }

    switch (type) {
      case 'health':
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-3">✅ Health Check Results</h4>
            <div className="space-y-2">
              <p className="text-sm"><strong>Health Score:</strong> {data.summary.healthScore}</p>
              <p className="text-sm"><strong>Processing Time:</strong> {data.processingTime}</p>
              <p className="text-sm"><strong>Services:</strong> {data.summary.operationalServices}/{data.summary.totalServices} operational</p>
              {data.summary.majorIssues > 0 && (
                <p className="text-sm text-red-600"><strong>Major Issues:</strong> {data.summary.majorIssues}</p>
              )}
            </div>
          </div>
        )

      case 'assistants':
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3">🤖 Assistant Test Results</h4>
            <div className="space-y-2">
              <p className="text-sm"><strong>Overall Status:</strong> {data.summary.overallStatus}</p>
              <p className="text-sm"><strong>Processing Time:</strong> {data.processingTime}</p>
              <p className="text-sm"><strong>Tests:</strong> {data.summary.passedTests}/{data.summary.totalTests} passed</p>
              <div className="mt-3 space-y-1">
                {data.results.map((result: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span>{result.name}</span>
                    <span className={`px-2 py-1 rounded ${
                      result.status === 'operational' ? 'bg-green-100 text-green-700' :
                      result.status === 'degraded' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'alerts':
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-3">🚨 Active Alerts</h4>
            <div className="space-y-2">
              <p className="text-sm"><strong>Total Active:</strong> {data.summary.totalActiveAlerts}</p>
              <p className="text-sm"><strong>Critical:</strong> {data.summary.criticalAlerts} | <strong>Errors:</strong> {data.summary.errorAlerts} | <strong>Warnings:</strong> {data.summary.warningAlerts}</p>
              <p className="text-sm"><strong>Alert Rules:</strong> {data.summary.enabledRules}/{data.summary.totalRules} enabled</p>
              
              {data.alerts.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-gray-700">Recent Alerts:</p>
                  {data.alerts.slice(0, 3).map((alert: any, index: number) => (
                    <div key={index} className="text-xs bg-white p-2 rounded border">
                      <div className="flex justify-between">
                        <span className="font-medium">{alert.title}</span>
                        <span className={`px-1 rounded ${
                          alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                          alert.severity === 'error' ? 'bg-orange-100 text-orange-700' :
                          alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">{alert.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case 'telegram':
        return (
          <div className={`${data.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
            <h4 className={`font-medium mb-3 ${data.success ? 'text-green-900' : 'text-red-900'}`}>
              {data.success ? '✅ Telegram Test' : '❌ Telegram Test Failed'}
            </h4>
            <div className="space-y-2">
              <p className="text-sm"><strong>Status:</strong> {data.success ? 'Success' : 'Failed'}</p>
              <p className="text-sm"><strong>Processing Time:</strong> {data.processingTime}</p>
              {data.message && <p className="text-sm"><strong>Message:</strong> {data.message}</p>}
              {data.status && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-700">Configuration Status:</p>
                  <div className="text-xs bg-white p-2 rounded border mt-1">
                    <p><strong>Configured:</strong> {data.status.configured ? 'Yes' : 'No'}</p>
                    <p><strong>Bot Token:</strong> {data.status.botToken ? 'Set' : 'Missing'}</p>
                    <p><strong>Chat ID:</strong> {data.status.chatId ? 'Set' : 'Missing'}</p>
                  </div>
                </div>
              )}
              {!data.success && data.details && (
                <p className="text-sm text-red-600"><strong>Error:</strong> {data.details}</p>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const metrics = getMetrics()

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Real-time Metrics</h3>
            <p className="text-sm text-gray-600">
              Live performance indicators 
              {metricsLoading && <span className="text-yellow-600">• Updating...</span>}
            </p>
          </div>
          <button 
            onClick={fetchRealMetrics}
            disabled={metricsLoading}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            {metricsLoading ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>
      
      {/* Quick Actions */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">Quick Actions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={handleForceHealthCheck}
            disabled={loading === 'health'}
            className="flex items-center justify-center space-x-2 py-2 px-4 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'health' ? (
              <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
            ) : (
              <Activity className="w-4 h-4 text-gray-600" />
            )}
            <span className="text-sm font-medium text-gray-700">
              {loading === 'health' ? 'Checking...' : 'Force Health Check'}
            </span>
          </button>
          
          <button 
            onClick={handleTestAssistants}
            disabled={loading === 'assistants'}
            className="flex items-center justify-center space-x-2 py-2 px-4 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'assistants' ? (
              <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 text-gray-600" />
            )}
            <span className="text-sm font-medium text-gray-700">
              {loading === 'assistants' ? 'Testing...' : 'Test Assistants'}
            </span>
          </button>
          
          <button 
            onClick={handleViewAlerts}
            disabled={loading === 'alerts'}
            className="flex items-center justify-center space-x-2 py-2 px-4 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'alerts' ? (
              <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-gray-600" />
            )}
            <span className="text-sm font-medium text-gray-700">
              {loading === 'alerts' ? 'Loading...' : 'View Alerts'}
            </span>
          </button>
          
          <button 
            onClick={handleTestTelegram}
            disabled={loading === 'telegram'}
            className="flex items-center justify-center space-x-2 py-2 px-4 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'telegram' ? (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            ) : (
              <span className="text-blue-600">📱</span>
            )}
            <span className="text-sm font-medium text-gray-700">
              {loading === 'telegram' ? 'Testing...' : 'Test Telegram'}
            </span>
          </button>
        </div>
      </div>

      {/* Results Display */}
      {showResults && results && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Action Results</h4>
            <button 
              onClick={() => setShowResults(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ✕ Close
            </button>
          </div>
          {formatResults()}
        </div>
      )}
    </div>
  )
}
