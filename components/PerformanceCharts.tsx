'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Clock, Database, Zap, Activity } from 'lucide-react'

interface PerformanceMetric {
  title: string
  current: string
  trend: 'up' | 'down' | 'stable'
  change: string
  status: 'good' | 'warning' | 'critical'
  icon: React.ReactNode
  description: string
}

export default function PerformanceCharts() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    fetchPerformanceMetrics()
    
    // Update every minute
    const interval = setInterval(fetchPerformanceMetrics, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchPerformanceMetrics = async () => {
    try {
      setLoading(true)
      
      const [systemResponse, serviceResponse] = await Promise.allSettled([
        fetch('/api/system-details'),
        fetch('/api/service-status')
      ])
      
      let systemData = null
      let serviceData = null
      
      if (systemResponse.status === 'fulfilled' && systemResponse.value.ok) {
        const data = await systemResponse.value.json()
        systemData = data.data
      }
      
      if (serviceResponse.status === 'fulfilled' && serviceResponse.value.ok) {
        const data = await serviceResponse.value.json()
        serviceData = data
      }
      
      const calculatedMetrics = calculateMetrics(systemData, serviceData)
      setMetrics(calculatedMetrics)
      setLastUpdate(new Date())
      
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error)
      // Set fallback metrics
      setMetrics([
        {
          title: 'System Status',
          current: 'Unknown',
          trend: 'stable',
          change: 'No data',
          status: 'warning',
          icon: <Activity className="w-6 h-6 text-gray-600" />,
          description: 'Unable to fetch system metrics'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const calculateMetrics = (systemData: any, serviceData: any): PerformanceMetric[] => {
    const metrics: PerformanceMetric[] = []
    
    // Database performance
    const dbComponent = systemData?.systemComponents?.find((c: any) => c.title === 'Database Cluster')
    if (dbComponent) {
      const queryTime = dbComponent.details?.find((d: any) => d.label === 'Query Time')?.value
      const queryTimeMs = queryTime ? parseInt(queryTime.replace('ms', '')) : 0
      
      metrics.push({
        title: 'Database Performance',
        current: queryTime || 'N/A',
        trend: queryTimeMs > 50 ? 'up' : queryTimeMs > 20 ? 'stable' : 'down',
        change: queryTimeMs > 50 ? 'Slower' : queryTimeMs > 20 ? 'Normal' : 'Faster',
        status: queryTimeMs > 100 ? 'critical' : queryTimeMs > 50 ? 'warning' : 'good',
        icon: <Database className="w-6 h-6 text-blue-600" />,
        description: 'PostgreSQL query response time'
      })
    }
    
    // OpenAI performance
    const openaiComponent = systemData?.systemComponents?.find((c: any) => c.title === 'OpenAI Services')
    if (openaiComponent) {
      const latency = openaiComponent.details?.find((d: any) => d.label === 'Average Latency')?.value
      const latencyMs = latency ? parseInt(latency.replace('ms', '')) : 0
      
      metrics.push({
        title: 'AI Response Time',
        current: latency || 'N/A',
        trend: latencyMs > 2000 ? 'up' : latencyMs > 1000 ? 'stable' : 'down',
        change: latencyMs > 2000 ? 'Degraded' : latencyMs > 1000 ? 'Normal' : 'Fast',
        status: latencyMs > 3000 ? 'critical' : latencyMs > 2000 ? 'warning' : 'good',
        icon: <Zap className="w-6 h-6 text-purple-600" />,
        description: 'OpenAI Assistants response time'
      })
    }
    
    // Service availability
    if (serviceData?.summary) {
      const { total, operational } = serviceData.summary
      const availability = total > 0 ? (operational / total * 100) : 0
      
      metrics.push({
        title: 'Service Availability',
        current: `${availability.toFixed(1)}%`,
        trend: availability === 100 ? 'stable' : availability > 80 ? 'down' : 'up',
        change: availability === 100 ? 'All Online' : `${operational}/${total} Services`,
        status: availability === 100 ? 'good' : availability > 80 ? 'warning' : 'critical',
        icon: <Activity className="w-6 h-6 text-green-600" />,
        description: 'Percentage of services operational'
      })
    }
    
    // Overall health score
    if (systemData?.summary?.overallUptime) {
      const uptime = parseFloat(systemData.summary.overallUptime)
      
      metrics.push({
        title: 'System Health',
        current: `${uptime}%`,
        trend: uptime > 95 ? 'stable' : uptime > 90 ? 'down' : 'up',
        change: uptime > 95 ? 'Excellent' : uptime > 90 ? 'Good' : 'Needs Attention',
        status: uptime > 95 ? 'good' : uptime > 90 ? 'warning' : 'critical',
        icon: <TrendingUp className="w-6 h-6 text-indigo-600" />,
        description: 'Overall system health score'
      })
    }
    
    return metrics
  }

  const formatLastUpdate = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    
    if (diffSec < 60) return `${diffSec}s ago`
    if (diffMin < 60) return `${diffMin}m ago`
    return date.toLocaleTimeString()
  }

  if (loading && metrics.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
            <p className="text-sm text-gray-600">Real-time system performance metrics</p>
          </div>
          <div className="text-xs text-gray-500">
            Last updated: {formatLastUpdate(lastUpdate)}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metrics.map((metric, index) => (
            <div key={index} className={`p-6 rounded-lg border-2 ${
              metric.status === 'good' ? 'border-green-200 bg-green-50' :
              metric.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
              'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    metric.status === 'good' ? 'bg-green-100' :
                    metric.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    {metric.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{metric.title}</h4>
                    <p className="text-xs text-gray-500">{metric.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  {metric.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  ) : metric.trend === 'down' ? (
                    <TrendingDown className="w-4 h-4 text-green-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{metric.current}</div>
                  <div className="text-sm text-gray-600">{metric.change}</div>
                </div>
                
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  metric.status === 'good' ? 'bg-green-100 text-green-700' :
                  metric.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {metric.status.toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {metrics.length === 0 && (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Performance Data</h4>
            <p className="text-gray-600">Performance metrics will appear here when data is available.</p>
          </div>
        )}
      </div>
      
      {/* Performance Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <h4 className="font-semibold text-gray-900 mb-4">Performance Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {metrics.filter(m => m.status === 'good').length}
            </div>
            <div className="text-sm text-gray-600">Metrics in Good State</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {metrics.filter(m => m.status === 'warning').length}
            </div>
            <div className="text-sm text-gray-600">Metrics with Warnings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {metrics.filter(m => m.status === 'critical').length}
            </div>
            <div className="text-sm text-gray-600">Critical Metrics</div>
          </div>
        </div>
      </div>
    </div>
  )
}
