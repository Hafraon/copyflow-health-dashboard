import { AlertTriangle, CheckCircle, Clock, Info } from 'lucide-react'

interface Incident {
  id: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  startTime: string
  endTime?: string
  duration?: string
  affectedServices: string[]
  updates: Array<{
    time: string
    message: string
    type: 'update' | 'resolution'
  }>
}

export default function IncidentHistory() {
  // Mock data - в production з БД
  const incidents: Incident[] = [
    {
      id: 'INC-2025-001',
      title: 'Increased Response Times for Elite Assistant',
      description: 'Users experiencing slower content generation with Elite Assistant',
      severity: 'warning',
      status: 'monitoring',
      startTime: '2025-08-08 14:23',
      affectedServices: ['OpenAI Elite Assistant', 'Content Generation'],
      updates: [
        {
          time: '14:45',
          message: 'Issue identified with OpenAI API rate limiting. Implementing temporary optimizations.',
          type: 'update'
        },
        {
          time: '14:30',
          message: 'Investigating reports of increased response times for Elite Assistant.',
          type: 'update'
        }
      ]
    },
    {
      id: 'INC-2025-002',
      title: 'Scheduled Database Maintenance',
      description: 'Planned maintenance for database optimization and index rebuilding',
      severity: 'info',
      status: 'resolved',
      startTime: '2025-08-07 02:00',
      endTime: '2025-08-07 02:30',
      duration: '30 minutes',
      affectedServices: ['Database', 'User Authentication'],
      updates: [
        {
          time: '02:30',
          message: 'Maintenance completed successfully. All services restored.',
          type: 'resolution'
        },
        {
          time: '02:00',
          message: 'Beginning scheduled database maintenance.',
          type: 'update'
        }
      ]
    }
  ]

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'monitoring':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'investigating':
      case 'identified':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Incidents & Updates</h3>
            <p className="text-sm text-gray-600">System incidents, maintenance, and status updates</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-600">No Active Incidents</span>
          </div>
        </div>
      </div>

      {incidents.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">All Systems Running Smoothly</h4>
          <p className="text-gray-600">No incidents or maintenance activities in the last 30 days.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {incidents.map((incident) => (
            <div key={incident.id} className="px-6 py-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  {getSeverityIcon(incident.severity)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{incident.title}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(incident.status)}`}>
                      {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{incident.description}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Started: {incident.startTime}</span>
                    </div>
                    {incident.endTime && (
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Resolved: {incident.endTime}</span>
                      </div>
                    )}
                    {incident.duration && (
                      <div>
                        <span className="font-medium">Duration: {incident.duration}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-700">Affected Services: </span>
                    <span className="text-sm text-gray-600">
                      {incident.affectedServices.join(', ')}
                    </span>
                  </div>
                  
                  {incident.updates.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Updates:</h5>
                      <div className="space-y-2">
                        {incident.updates.map((update, index) => (
                          <div key={index} className="flex items-start space-x-2 text-sm">
                            <span className="text-gray-500 font-medium">{update.time}</span>
                            <span className="text-gray-600">{update.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {incidents.filter(i => i.status !== 'resolved').length} active incidents
          </span>
          <div className="flex items-center space-x-4">
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              View All Incidents
            </a>
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              Subscribe to Updates
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
