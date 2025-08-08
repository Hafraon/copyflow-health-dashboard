import { ArrowUp, ArrowDown, Clock, Users, Zap, CheckCircle, AlertTriangle, Activity } from 'lucide-react'

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
          <div className={`p-2 rounded-lg ${status === 'good' ? 'bg-green-100' : status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'}`}>
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
  // В production ці дані прийдуть з real-time API
  const metrics = [
    {
      title: 'Average Response Time',
      value: '2.8s',
      change: { value: 12, trend: 'up' as const, timeframe: 'vs last hour' },
      status: 'warning' as const,
      icon: <Clock className="w-5 h-5 text-yellow-600" />,
      description: 'Average generation time across all assistants'
    },
    {
      title: 'Success Rate',
      value: '98.5%',
      change: { value: 2, trend: 'up' as const, timeframe: 'vs yesterday' },
      status: 'good' as const,
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      description: 'Successful generations in the last 24 hours'
    },
    {
      title: 'Active Users',
      value: '24',
      change: { value: 8, trend: 'up' as const, timeframe: 'vs last hour' },
      status: 'good' as const,
      icon: <Users className="w-5 h-5 text-blue-600" />,
      description: 'Users currently using the system'
    },
    {
      title: 'Generations/Hour',
      value: '142',
      change: { value: 15, trend: 'up' as const, timeframe: 'vs last hour' },
      status: 'good' as const,
      icon: <Zap className="w-5 h-5 text-purple-600" />,
      description: 'Content generations processed per hour'
    },
    {
      title: 'Assistant Uptime',
      value: '99.7%',
      change: { value: 0.2, trend: 'down' as const, timeframe: 'vs last week' },
      status: 'good' as const,
      icon: <Activity className="w-5 h-5 text-green-600" />,
      description: 'OpenAI Assistants availability'
    },
    {
      title: 'Error Rate',
      value: '1.5%',
      change: { value: 5, trend: 'down' as const, timeframe: 'vs yesterday' },
      status: 'good' as const,
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
      description: 'Failed requests in the last 24 hours'
    }
  ]

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Real-time Metrics</h3>
        <p className="text-sm text-gray-600">Live performance indicators updated every 30 seconds</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>
      
      {/* Quick Actions */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">Quick Actions</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center space-x-2 py-2 px-4 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <Activity className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Force Health Check</span>
          </button>
          <button className="flex items-center justify-center space-x-2 py-2 px-4 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <Zap className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Test Assistants</span>
          </button>
          <button className="flex items-center justify-center space-x-2 py-2 px-4 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <AlertTriangle className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">View Alerts</span>
          </button>
        </div>
      </div>
    </div>
  )
}
