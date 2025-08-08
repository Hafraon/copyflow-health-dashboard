import { getSystemHealth } from '@/lib/monitoring'

interface ServiceStatus {
  name: string
  status: 'operational' | 'degraded' | 'partial' | 'major' | 'maintenance'
  responseTime?: number
  lastChecked: string
  description: string
}

export default async function StatusOverview() {
  // В production це буде реальні дані з БД
  const services: ServiceStatus[] = [
    {
      name: 'CopyFlow API Gateway',
      status: 'operational',
      responseTime: 127,
      lastChecked: 'Just now',
      description: 'Main API endpoints and routing'
    },
    {
      name: 'Content Generation Engine',
      status: 'degraded',
      responseTime: 3200,
      lastChecked: '30s ago',
      description: 'AI content generation and processing'
    },
    {
      name: 'Authentication System',
      status: 'operational',
      responseTime: 45,
      lastChecked: 'Just now',
      description: 'User authentication and authorization'
    },
    {
      name: 'Database Services',
      status: 'operational',
      responseTime: 12,
      lastChecked: 'Just now',
      description: 'PostgreSQL database and connections'
    },
    {
      name: 'Payment Processing',
      status: 'operational',
      responseTime: 89,
      lastChecked: '1m ago',
      description: 'WayForPay integration and billing'
    },
    {
      name: 'OpenAI Elite Assistant',
      status: 'operational',
      responseTime: 2800,
      lastChecked: 'Just now',
      description: 'Premium AI content generation'
    },
    {
      name: 'OpenAI Standard Assistant',
      status: 'operational',
      responseTime: 1200,
      lastChecked: 'Just now',
      description: 'Standard AI content generation'
    },
    {
      name: 'File Processing & Export',
      status: 'operational',
      responseTime: 234,
      lastChecked: '2m ago',
      description: 'CSV export and file handling'
    }
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
        <p className="text-sm text-gray-600">Current operational status of all CopyFlow services</p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {services.map((service, index) => (
          <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`status-dot status-dot-${service.status}`}></div>
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
                
                <div className="text-right">
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
            {services.filter(s => s.status === 'operational').length} of {services.length} services operational
          </span>
          <span className="text-gray-500">
            Updated every 30 seconds
          </span>
        </div>
      </div>
    </div>
  )
}
