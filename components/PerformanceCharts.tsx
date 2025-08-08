'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

export default function PerformanceCharts() {
  // Mock data для демонстрації - в production це буде з БД
  const responseTimeData = [
    { time: '00:00', elite: 2.1, standard: 1.2, average: 1.8 },
    { time: '04:00', elite: 2.3, standard: 1.1, average: 1.9 },
    { time: '08:00', elite: 3.2, standard: 1.8, average: 2.8 },
    { time: '12:00', elite: 4.1, standard: 2.1, average: 3.4 },
    { time: '16:00', elite: 3.8, standard: 1.9, average: 3.1 },
    { time: '20:00', elite: 2.9, standard: 1.4, average: 2.3 },
    { time: 'Now', elite: 2.8, standard: 1.2, average: 2.0 },
  ]

  const successRateData = [
    { time: '00:00', success: 99.2, errors: 0.8 },
    { time: '04:00', success: 99.5, errors: 0.5 },
    { time: '08:00', success: 98.1, errors: 1.9 },
    { time: '12:00', success: 97.8, errors: 2.2 },
    { time: '16:00', success: 98.9, errors: 1.1 },
    { time: '20:00', success: 99.1, errors: 0.9 },
    { time: 'Now', success: 98.5, errors: 1.5 },
  ]

  return (
    <div className="space-y-8">
      {/* Response Time Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Response Time Trends</h3>
          <p className="text-sm text-gray-600">Average response times over the last 24 hours</p>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                label={{ value: 'Seconds', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: number, name: string) => [
                  `${value}s`,
                  name === 'elite' ? 'Elite Assistant' :
                  name === 'standard' ? 'Standard Assistant' : 'Average'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="elite" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                name="elite"
              />
              <Line 
                type="monotone" 
                dataKey="standard" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                name="standard"
              />
              <Line 
                type="monotone" 
                dataKey="average" 
                stroke="#6366f1" 
                strokeWidth={3}
                dot={{ fill: '#6366f1', strokeWidth: 2, r: 5 }}
                name="average"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Elite Assistant</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Standard Assistant</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
            <span className="text-gray-600">System Average</span>
          </div>
        </div>
      </div>

      {/* Success Rate Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Success Rate & Errors</h3>
          <p className="text-sm text-gray-600">Request success rate and error percentage</p>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={successRateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                domain={[95, 100]}
                label={{ value: 'Percentage', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: number, name: string) => [
                  `${value}%`,
                  name === 'success' ? 'Success Rate' : 'Error Rate'
                ]}
              />
              <Area
                type="monotone"
                dataKey="success"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
                name="success"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">98.5%</div>
            <div className="text-sm text-green-700">Success Rate</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">1.5%</div>
            <div className="text-sm text-red-700">Error Rate</div>
          </div>
        </div>
      </div>
    </div>
  )
}
