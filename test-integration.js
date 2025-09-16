/**
 * CopyFlow Health Dashboard - Test Integration Script
 * Тестує зв'язок між основним проектом та health dashboard
 */

// Test admin-dashboard API endpoints
async function testHealthDashboard() {
  const dashboardUrl = process.env.MONITORING_DASHBOARD_URL || 'http://localhost:3001'
  
  console.log('🧪 Testing Health Dashboard Integration...')
  console.log('Dashboard URL:', dashboardUrl)
  
  try {
    // 1. Test health endpoint
    console.log('\n1️⃣ Testing health endpoint...')
    const healthResponse = await fetch(`${dashboardUrl}/api/health`)
    const healthData = await healthResponse.json()
    console.log('✅ Health check:', healthData.status)
    
    // 2. Test metrics endpoint
    console.log('\n2️⃣ Testing metrics POST...')
    const testMetric = {
      metric: 'generation_performance',
      value: 1500,
      timestamp: new Date().toISOString(),
      metadata: {
        requestId: 'test-' + Date.now(),
        userId: 'test-user',
        model: 'gpt-5-nano',
        success: true,
        tokensUsed: 100,
        cost: 0.005,
        service: 'copyflow_responses_api',
        generationMethod: 'test'
      }
    }
    
    const metricsResponse = await fetch(`${dashboardUrl}/api/metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'copyflow-main'
      },
      body: JSON.stringify(testMetric)
    })
    
    const metricsData = await metricsResponse.json()
    console.log('✅ Metrics POST:', metricsData.success ? 'SUCCESS' : 'FAILED')
    
    // 3. Test batch metrics
    console.log('\n3️⃣ Testing batch metrics...')
    const batchMetrics = {
      metrics: [
        {
          metric: 'credit_operation',
          value: 5,
          metadata: {
            userId: 'test-user',
            operation: 'commit',
            success: true,
            service: 'credit_manager'
          }
        },
        {
          metric: 'api_response_time',
          value: 850,
          metadata: {
            endpoint: '/api/generate',
            method: 'POST',
            success: true,
            service: 'api'
          }
        }
      ]
    }
    
    const batchResponse = await fetch(`${dashboardUrl}/api/metrics/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'copyflow-main'
      },
      body: JSON.stringify(batchMetrics)
    })
    
    const batchData = await batchResponse.json()
    console.log('✅ Batch metrics:', batchData.success ? 'SUCCESS' : 'FAILED')
    console.log('   Processed:', batchData.processed)
    console.log('   Errors:', batchData.errors)
    
    // 4. Test metrics GET
    console.log('\n4️⃣ Testing metrics GET...')
    const getResponse = await fetch(`${dashboardUrl}/api/metrics?timeframe=1h`)
    const getData = await getResponse.json()
    console.log('✅ Metrics GET:', getData.success ? 'SUCCESS' : 'FAILED')
    
    console.log('\n🎉 Integration Test Complete!')
    console.log('Dashboard is ready to receive metrics from main project.')
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message)
    console.log('Make sure admin-dashboard is running on port 3001')
  }
}

// Test health monitoring from main project
async function testHealthMonitoring() {
  console.log('\n🔄 Testing Health Monitoring Client...')
  
  try {
    // Import health monitoring (would need to be run in main project context)
    const { healthMonitor, trackGeneration, trackCreditOperation, checkMonitoringHealth } = require('../lib/health-monitoring')
    
    // Test health check
    const health = await checkMonitoringHealth()
    console.log('Dashboard reachable:', health.dashboardReachable)
    console.log('Response time:', health.responseTime + 'ms')
    
    // Test tracking functions
    await trackGeneration({
      requestId: 'test-' + Date.now(),
      userId: 'test-user',
      model: 'gpt-5-nano',
      processingTime: 1200,
      success: true,
      tokensUsed: 150,
      cost: 0.006,
      category: 'electronics'
    })
    
    await trackCreditOperation({
      userId: 'test-user',
      operation: 'commit',
      amount: 3,
      success: true,
      operationType: 'single_product'
    })
    
    console.log('✅ Health monitoring client working!')
    
  } catch (error) {
    console.error('❌ Health monitoring test failed:', error.message)
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 CopyFlow Health Dashboard Integration Tests')
  console.log('==============================================')
  
  await testHealthDashboard()
  // await testHealthMonitoring() // Uncomment when running in main project
  
  console.log('\n📋 Next Steps:')
  console.log('1. Start admin-dashboard: cd admin-dashboard && npm run dev')
  console.log('2. Start main project: cd project && npm run dev')
  console.log('3. Test generation in main project to see metrics in dashboard')
  console.log('4. Check dashboard at http://localhost:3001')
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testHealthDashboard, testHealthMonitoring, runTests }
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error)
}
