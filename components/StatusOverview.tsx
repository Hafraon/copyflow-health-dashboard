'use client'

import { useState, useEffect } from 'react'

interface ServiceStatus {
  name: string
  status: 'operational' | 'degraded' | 'partial' | 'major' | 'maintenance'
  responseTime?: number
  lastChecked: string
  description: string
}

export default function StatusOverview() {
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRealServiceStatus()
    
    // Оновлення кожні 30 секунд
    const interval = setInterval(fetchRealServiceStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchRealServiceStatus = async () => {
    try {
      const response = await fetch('/api/service-status')
      const data = await response.json()
      
      if (data.success) {
        setServices(data.services)
      }
    } catch (error) {
      console.error('Failed to fetch service status:', error)
      // Fallback to basic services if API fails
      setServices([
        {
          name: 'CopyFlow Application',
          status: 'major',
          description: 'Main application and API endpoints',
          lastChecked: 'Connection failed'
        },
        {
          name: 'Database',
          status: 'operational',
          responseTime: 12,
          description: 'PostgreSQL database on Railway',
          lastChecked: 'Just now'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const operationalCount = services.filter(s => s.status === 'operational').length
  const totalCount = services.length
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
        <p className="text-sm text-gray-600">Current operational status of CopyFlow services</p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {services.map((service, index) => (
          <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  service.status === 'operational' ? 'bg-green-500' :
                  service.status === 'degraded' ? 'bg-yellow-500' :
                  service.status === 'partial' ? 'bg-orange-500' :
                  service.status === 'major' ? 'bg-red-500' : 'bg-gray-500'
                }`}></div>
                <div>
                  <h4 className="font-medium text-gray-900">{service.name}</h4>
                  <p className="text-sm text-gray-500">{service.description}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 text-sm">
                {service.responseTime && (
                  <div className="text-right">
                    <span className="text-gray-500">Response Time</span>
                    <div className={`font-medium ${
                      service.responseTime > 2000 ? 'text-yellow-600' : 
                      service.responseTime > 5000 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {service.responseTime}ms
                    </div>
                  </div>
                )}
                
                <div className="text-right">
                  <span className="text-gray-500">Status</span>
                  <div className={`font-medium capitalize ${
                    service.status === 'operational' ? 'text-green-600' :
                    service.status === 'degraded' ? 'text-yellow-600' :
                    service.status === 'partial' ? 'text-orange-600' :
                    service.status === 'major' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {service.status}
                  </div>
                </div>
                
                <div className="text-right min-w-[80px]">
                  <span className="text-gray-500">Last Checked</span>
                  <div className="font-medium text-gray-900">{service.lastChecked}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {operationalCount} of {totalCount} services operational
          </span>
          <span className="text-gray-500">
            Updated every 30 seconds
          </span>
        </div>
      </div>
    </div>
  )
}
