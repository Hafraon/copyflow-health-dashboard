import { Suspense } from 'react'
import StatusOverview from '@/components/StatusOverview'
import MetricsGrid from '@/components/MetricsGrid'
import PerformanceCharts from '@/components/PerformanceCharts'
import IncidentHistory from '@/components/IncidentHistory'
import SystemDetails from '@/components/SystemDetails'

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Hero Status Section - Anthropic Style */}
      <div className="text-center py-8">
        <div className="inline-flex items-center space-x-2 mb-4">
          <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
          <h2 className="text-2xl font-bold text-gray-900">All Systems Operational</h2>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          CopyFlow is running smoothly. All services are operating normally with no current incidents.
        </p>
      </div>

      {/* Quick Status Overview */}
      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>}>
        <StatusOverview />
      </Suspense>

      {/* Real-time Metrics Grid */}
      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>}>
        <MetricsGrid />
      </Suspense>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-80 rounded-lg"></div>}>
          <PerformanceCharts />
        </Suspense>
        
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-80 rounded-lg"></div>}>
          <SystemDetails />
        </Suspense>
      </div>

      {/* Recent Incidents & Maintenance */}
      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>}>
        <IncidentHistory />
      </Suspense>

      {/* Footer Status */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">System Health Score</span>
            <span className="text-2xl font-bold text-green-600">99.7%</span>
          </div>
          <div className="text-sm text-gray-500">
            Updated every 30 seconds • Next check in <span className="font-medium">12s</span>
          </div>
        </div>
      </div>
    </div>
  )
}
