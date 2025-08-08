import { Server, Database, Zap, Globe, Shield, CreditCard } from 'lucide-react'

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

  return (
    <div className={`bg-white rounded-lg border-l-4 border shadow-sm p-6 ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${status === 'online' ? 'bg-green-100' : status === 'degraded' ? 'bg-yellow-100' : 'bg-red-100'}`}>
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <span className={`text-sm font-medium ${
              status === 'online' ? 'text-green-600' :
              status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {statusText[status]}
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-500">{lastUpdate}</div>
      </div>
      
      <div className="space-y-3">
        {details.map((detail, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{detail.label}</span>
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
  const systemComponents = [
    {
      icon: <Server className="w-5 h-5" />,
      title: 'Application Server',
      status: 'online' as const,
      details: [
        { label: 'CPU Usage', value: '24%', status: 'good' as const },
        { label: 'Memory Usage', value: '68%', status: 'good' as const },
        { label: 'Disk Space', value: '45%', status: 'good' as const },
        { label: 'Active Connections', value: '127', status: 'good' as const }
      ],
      lastUpdate: '30s ago'
    },
    {
      icon: <Database className="w-5 h-5" />,
      title: 'Database Cluster',
      status: 'online' as const,
      details: [
        { label: 'Query Time', value: '12ms', status: 'good' as const },
        { label: 'Active Connections', value: '15/100', status: 'good' as const },
        { label: 'Cache Hit Rate', value: '94.2%', status: 'good' as const },
        { label: 'Storage Used', value: '2.1GB', status: 'good' as const }
      ],
      lastUpdate: '15s ago'
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'OpenAI Services',
      status: 'degraded' as const,
      details: [
        { label: 'Elite Assistant', value: 'Online', status: 'warning' as const },
        { label: 'Standard Assistant', value: 'Online', status: 'good' as const },
        { label: 'Average Latency', value: '2.8s', status: 'warning' as const },
        { label: 'Queue Length', value: '3 pending', status: 'good' as const }
      ],
      lastUpdate: 'Just now'
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: 'CDN & External APIs',
      status: 'online' as const,
      details: [
        { label: 'Railway Status', value: 'Operational', status: 'good' as const },
        { label: 'Supabase Status', value: 'Operational', status: 'good' as const },
        { label: 'OpenAI Status', value: 'Degraded', status: 'warning' as const },
        { label: 'Average Latency', value: '89ms', status: 'good' as const }
      ],
      lastUpdate: '1m ago'
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Security & Auth',
      status: 'online' as const,
      details: [
        { label: 'Auth Success Rate', value: '99.8%', status: 'good' as const },
        { label: 'Active Sessions', value: '24', status: 'good' as const },
        { label: 'Failed Logins', value: '2/hour', status: 'good' as const },
        { label: 'Security Alerts', value: '0', status: 'good' as const }
      ],
      lastUpdate: '45s ago'
    },
    {
      icon: <CreditCard className="w-5 h-5" />,
      title: 'Payment Systems',
      status: 'online' as const,
      details: [
        { label: 'WayForPay Status', value: 'Online', status: 'good' as const },
        { label: 'Transaction Rate', value: '100%', status: 'good' as const },
        { label: 'Processing Time', value: '89ms', status: 'good' as const },
        { label: 'Failed Payments', value: '0', status: 'good' as const }
      ],
      lastUpdate: '2m ago'
    }
  ]

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">System Components</h3>
        <p className="text-sm text-gray-600">Detailed status of all system components and dependencies</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {systemComponents.map((component, index) => (
          <SystemDetailCard key={index} {...component} />
        ))}
      </div>
      
      {/* System Summary */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <h4 className="font-semibold text-gray-900 mb-4">System Health Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">5/6</div>
            <div className="text-sm text-gray-600">Components Online</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">1/6</div>
            <div className="text-sm text-gray-600">Degraded Services</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">99.7%</div>
            <div className="text-sm text-gray-600">Overall Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">2.8s</div>
            <div className="text-sm text-gray-600">Avg Response</div>
          </div>
        </div>
      </div>
    </div>
  )
}
