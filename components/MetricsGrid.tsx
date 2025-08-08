'use client';

import { useState } from 'react';
import { ArrowUp, ArrowDown, Clock, Users, Zap, CheckCircle, AlertTriangle, Activity, Loader2 } from 'lucide-react';

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
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

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
  ];

  const handleForceHealthCheck = async () => {
    setLoading('health');
    setResults(null);
    try {
      const response = await fetch('/api/actions/force-health-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setResults({ type: 'health', data });
      setShowResults(true);
    } catch (error) {
      setResults({ 
        type: 'health', 
        data: { 
          success: false, 
          error: 'Failed to perform health check',
          details: error instanceof Error ? error.message : 'Network error'
        } 
      });
      setShowResults(true);
    } finally {
      setLoading(null);
    }
  };

  const handleTestAssistants = async () => {
    setLoading('assistants');
    setResults(null);
    try {
      const response = await fetch('/api/actions/test-assistants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setResults({ type: 'assistants', data });
      setShowResults(true);
    } catch (error) {
      setResults({ 
        type: 'assistants', 
        data: { 
          success: false, 
          error: 'Failed to test assistants',
          details: error instanceof Error ? error.message : 'Network error'
        } 
      });
      setShowResults(true);
    } finally {
      setLoading(null);
    }
  };

  const handleViewAlerts = async () => {
    setLoading('alerts');
    setResults(null);
    try {
      const response = await fetch('/api/actions/view-alerts?limit=10');
      const data = await response.json();
      setResults({ type: 'alerts', data });
      setShowResults(true);
    } catch (error) {
      setResults({ 
        type: 'alerts', 
        data: { 
          success: false, 
          error: 'Failed to fetch alerts',
          details: error instanceof Error ? error.message : 'Network error'
        } 
      });
      setShowResults(true);
    } finally {
      setLoading(null);
    }
  };

  const formatResults = () => {
    if (!results) return null;

    const { type, data } = results;

    if (!data.success) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-900 mb-2">❌ {data.error}</h4>
          <p className="text-sm text-red-700">{data.details}</p>
        </div>
      );
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
        );

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
        );

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
        );

      default:
        return null;
    }
  };

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
