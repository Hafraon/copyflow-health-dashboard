// CopyFlow Health Dashboard - System Test Suite
// Run this script to test all dashboard functionality

import { alertService } from './lib/alerts/index'
import { emailAlertService } from './lib/alerts/email'
import { telegramAlertService } from './lib/alerts/telegram'

console.log('🧪 CopyFlow Health Dashboard - System Tests')
console.log('===========================================')

async function testDatabaseConnection() {
  console.log('\n📊 Testing database connection...')
  
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Test basic query
    const count = await prisma.systemHealth.count()
    console.log(`📊 Current health records: ${count}`)
    
    await prisma.$disconnect()
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    return false
  }
}

async function testEmailAlerts() {
  console.log('\n📧 Testing email alert system...')
  
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️ Email not configured - skipping test')
    return true
  }
  
  try {
    const result = await emailAlertService.testConnection()
    if (result) {
      console.log('✅ Email system working')
      
      // Send test alert
      await alertService.sendAlert({
        title: 'Test Alert',
        message: 'This is a test alert from CopyFlow Health Dashboard',
        severity: 'info',
        service: 'dashboard',
        channels: ['email']
      })
      console.log('📧 Test email sent')
    }
    return result
  } catch (error) {
    console.error('❌ Email test failed:', error.message)
    return false
  }
}

async function testTelegramAlerts() {
  console.log('\n📱 Testing Telegram alert system...')
  
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.log('⚠️ Telegram not configured - skipping test')
    return true
  }
  
  try {
    const result = await telegramAlertService.testConnection()
    if (result) {
      console.log('✅ Telegram system working')
    }
    return result
  } catch (error) {
    console.error('❌ Telegram test failed:', error.message)
    return false
  }
}

async function testHealthAPI() {
  console.log('\n🔍 Testing health API...')
  
  try {
    const response = await fetch('http://localhost:3001/api/health')
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Health API responding')
      console.log(`📊 Overall status: ${data.status}`)
      console.log(`⏱️ Response time: ${data.responseTime}ms`)
      return true
    } else {
      console.error('❌ Health API returned error:', response.status)
      return false
    }
  } catch (error) {
    console.error('❌ Health API test failed:', error.message)
    console.log('💡 Make sure dashboard is running: npm run dev')
    return false
  }
}

async function testMetricsAPI() {
  console.log('\n📈 Testing metrics API...')
  
  try {
    // Test GET metrics
    const getResponse = await fetch('http://localhost:3001/api/metrics')
    if (!getResponse.ok) {
      throw new Error(`GET /api/metrics failed: ${getResponse.status}`)
    }
    console.log('✅ Metrics GET API working')
    
    // Test POST metrics
    const postResponse = await fetch('http://localhost:3001/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: 'test_metric',
        value: 123,
        timestamp: new Date().toISOString(),
        metadata: { test: true }
      })
    })
    
    if (!postResponse.ok) {
      throw new Error(`POST /api/metrics failed: ${postResponse.status}`)
    }
    console.log('✅ Metrics POST API working')
    
    return true
  } catch (error) {
    console.error('❌ Metrics API test failed:', error.message)
    return false
  }
}

async function testMainProjectIntegration() {
  console.log('\n🔗 Testing main project integration...')
  
  const mainProjectUrl = process.env.MAIN_PROJECT_API_URL || 'http://localhost:3000'
  
  try {
    const response = await fetch(`${mainProjectUrl}/api/health`, {
      signal: AbortSignal.timeout(5000)
    })
    
    if (response.ok) {
      console.log('✅ Main project reachable')
      return true
    } else {
      console.log(`⚠️ Main project returned: ${response.status}`)
      return false
    }
  } catch (error) {
    console.log(`⚠️ Main project not reachable: ${error.message}`)
    console.log('💡 Start main project: cd ../project && npm run dev')
    return false
  }
}

async function runAllTests() {
  console.log('Starting comprehensive system tests...\n')
  
  const tests = [
    { name: 'Database', test: testDatabaseConnection },
    { name: 'Health API', test: testHealthAPI },
    { name: 'Metrics API', test: testMetricsAPI },
    { name: 'Email Alerts', test: testEmailAlerts },
    { name: 'Telegram Alerts', test: testTelegramAlerts },
    { name: 'Main Project Integration', test: testMainProjectIntegration }
  ]
  
  const results = []
  
  for (const { name, test } of tests) {
    try {
      const result = await test()
      results.push({ name, passed: result })
    } catch (error) {
      console.error(`❌ ${name} test crashed:`, error.message)
      results.push({ name, passed: false })
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 TEST RESULTS SUMMARY')
  console.log('='.repeat(50))
  
  const passed = results.filter(r => r.passed).length
  const total = results.length
  
  results.forEach(({ name, passed }) => {
    console.log(`${passed ? '✅' : '❌'} ${name}`)
  })
  
  console.log('\n' + '='.repeat(50))
  console.log(`📈 OVERALL: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`)
  
  if (passed === total) {
    console.log('🎉 All systems operational! Dashboard ready for production.')
  } else {
    console.log('⚠️ Some tests failed. Check configuration and try again.')
  }
  
  return passed === total
}

// Run tests if called directly
if (require.main === module) {
  runAllTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('💥 Test suite crashed:', error)
      process.exit(1)
    })
}

export { runAllTests }
