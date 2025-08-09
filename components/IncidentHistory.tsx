'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Clock, Info, RefreshCw } from 'lucide-react'

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
}

export default function IncidentHistory() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchIncidents()
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchIncidents, 120000)
    return () => clearInterval(interval)
  }, [])

  const fetchIncidents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/incidents')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setIncidents(data.incidents || [])
      } else {
        throw new Error(data.error || 'Failed to fetch incidents')
      }
      
    } catch (err) {
      console.error('Error fetching incidents:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      // Show empty state on error instead of demo data
      setIncidents([])
    } finally {
      setLoading(false)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className=\"w-5 h-5 text-red-600\" />
      case 'error':
        return <AlertTriangle className=\"w-5 h-5 text-red-500\" />
      case 'warning':
        return <AlertTriangle className=\"w-5 h-5 text-yellow-500\" />
      default:
        return <Info className=\"w-5 h-5 text-blue-500\" />
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

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const diffMs = end.getTime() - start.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minutes`
    } else {
      const hours = Math.floor(diffMinutes / 60)
      const remainingMinutes = diffMinutes % 60
      return `${hours}h ${remainingMinutes}m`
    }
  }

  const activeIncidents = incidents.filter(i => i.status !== 'resolved')

  if (loading) {
    return (
      <div className=\"bg-white rounded-lg border border-gray-200 shadow-sm p-6\">
        <div className=\"flex items-center space-x-3 mb-4\">
          <RefreshCw className=\"w-5 h-5 animate-spin text-blue-600\" />
          <span className=\"text-gray-600\">Loading incidents...</span>
        </div>
      </div>
    )
  }

  return (
    <div className=\"bg-white rounded-lg border border-gray-200 shadow-sm\">
      <div className=\"px-6 py-4 border-b border-gray-200\">
        <div className=\"flex items-center justify-between\">
          <div>
            <h3 className=\"text-lg font-semibold text-gray-900\">Recent Incidents & Updates</h3>\n            <p className=\"text-sm text-gray-600\">\n              {error ? 'Failed to load incidents' : 'Real system incidents and maintenance activities'}\n            </p>\n          </div>\n          <div className=\"flex items-center space-x-3\">\n            {error && (\n              <span className=\"text-sm text-red-600\">Connection Error</span>\n            )}\n            <div className=\"flex items-center space-x-2\">\n              <div className={`w-3 h-3 rounded-full ${\n                activeIncidents.length === 0 ? 'bg-green-500' : 'bg-red-500'\n              }`}></div>\n              <span className={`text-sm font-medium ${\n                activeIncidents.length === 0 ? 'text-green-600' : 'text-red-600'\n              }`}>\n                {activeIncidents.length === 0 ? 'No Active Incidents' : `${activeIncidents.length} Active Incident${activeIncidents.length > 1 ? 's' : ''}`}\n              </span>\n            </div>\n            <button \n              onClick={fetchIncidents}\n              disabled={loading}\n              className=\"text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50\"\n            >\n              Refresh\n            </button>\n          </div>\n        </div>\n      </div>\n\n      {error ? (\n        <div className=\"px-6 py-12 text-center\">\n          <AlertTriangle className=\"w-12 h-12 text-red-500 mx-auto mb-4\" />\n          <h4 className=\"text-lg font-medium text-gray-900 mb-2\">Unable to Load Incidents</h4>\n          <p className=\"text-gray-600 mb-4\">{error}</p>\n          <button \n            onClick={fetchIncidents}\n            className=\"text-blue-600 hover:text-blue-700 font-medium\"\n          >\n            Try Again\n          </button>\n        </div>\n      ) : incidents.length === 0 ? (\n        <div className=\"px-6 py-12 text-center\">\n          <CheckCircle className=\"w-12 h-12 text-green-500 mx-auto mb-4\" />\n          <h4 className=\"text-lg font-medium text-gray-900 mb-2\">All Systems Running Smoothly</h4>\n          <p className=\"text-gray-600\">No incidents or maintenance activities in the last 30 days.</p>\n        </div>\n      ) : (\n        <div className=\"divide-y divide-gray-200\">\n          {incidents.slice(0, 5).map((incident) => (\n            <div key={incident.id} className=\"px-6 py-6\">\n              <div className=\"flex items-start space-x-4\">\n                <div className=\"flex-shrink-0 mt-1\">\n                  {getSeverityIcon(incident.severity)}\n                </div>\n                \n                <div className=\"flex-1 min-w-0\">\n                  <div className=\"flex items-center justify-between mb-2\">\n                    <h4 className=\"text-lg font-medium text-gray-900\">{incident.title}</h4>\n                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(incident.status)}`}>\n                      {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}\n                    </span>\n                  </div>\n                  \n                  <p className=\"text-gray-600 mb-4\">{incident.description}</p>\n                  \n                  <div className=\"flex items-center space-x-6 text-sm text-gray-500 mb-4\">\n                    <div className=\"flex items-center space-x-1\">\n                      <Clock className=\"w-4 h-4\" />\n                      <span>Started: {new Date(incident.startTime).toLocaleString()}</span>\n                    </div>\n                    {incident.endTime && (\n                      <div className=\"flex items-center space-x-1\">\n                        <CheckCircle className=\"w-4 h-4 text-green-500\" />\n                        <span>Resolved: {new Date(incident.endTime).toLocaleString()}</span>\n                      </div>\n                    )}\n                    <div>\n                      <span className=\"font-medium\">Duration: {formatDuration(incident.startTime, incident.endTime)}</span>\n                    </div>\n                  </div>\n                  \n                  {incident.affectedServices.length > 0 && (\n                    <div className=\"mb-4\">\n                      <span className=\"text-sm font-medium text-gray-700\">Affected Services: </span>\n                      <span className=\"text-sm text-gray-600\">\n                        {incident.affectedServices.join(', ')}\n                      </span>\n                    </div>\n                  )}\n                </div>\n              </div>\n            </div>\n          ))}\n        </div>\n      )}\n      \n      <div className=\"px-6 py-3 bg-gray-50 border-t border-gray-200\">\n        <div className=\"flex items-center justify-between text-sm\">\n          <span className=\"text-gray-600\">\n            {activeIncidents.length} active incident{activeIncidents.length !== 1 ? 's' : ''}\n            {incidents.length > 5 && ` • Showing latest 5 of ${incidents.length}`}\n          </span>\n          <div className=\"flex items-center space-x-4\">\n            <span className=\"text-gray-500\">\n              Last updated: {new Date().toLocaleTimeString()}\n            </span>\n          </div>\n        </div>\n      </div>\n    </div>\n  )\n}
