import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // Уникнення static generation для API routes

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 [TEST-ASSISTANTS] Starting assistant connectivity test...');
    
    const startTime = Date.now();
    const testResults = [];
    
    // Test Elite Assistant
    if (process.env.OPENAI_ASSISTANT_ELITE && process.env.OPENAI_API_KEY) {
      console.log('🎯 [TEST-ASSISTANTS] Testing Elite Assistant...');
      try {
        const eliteStartTime = Date.now();
        
        // Simple test request to OpenAI
        const response = await fetch('https://api.openai.com/v1/assistants/' + process.env.OPENAI_ASSISTANT_ELITE, {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
            'OpenAI-Beta': 'assistants=v2'
          },
          signal: AbortSignal.timeout(10000)
        });
        
        const eliteResponseTime = Date.now() - eliteStartTime;
        
        if (response.ok) {
          const assistantData = await response.json();
          testResults.push({
            name: 'Elite Assistant',
            status: 'operational',
            responseTime: eliteResponseTime,
            assistantId: process.env.OPENAI_ASSISTANT_ELITE.substring(0, 10) + '...',
            model: assistantData.model || 'unknown',
            lastTest: new Date().toISOString()
          });
          console.log('✅ [TEST-ASSISTANTS] Elite Assistant test passed');
        } else {
          testResults.push({
            name: 'Elite Assistant',
            status: 'degraded',
            responseTime: eliteResponseTime,
            error: `HTTP ${response.status}`,
            lastTest: new Date().toISOString()
          });
          console.log('⚠️ [TEST-ASSISTANTS] Elite Assistant test failed:', response.status);
        }
        
      } catch (eliteError) {
        testResults.push({
          name: 'Elite Assistant',
          status: 'major',
          error: eliteError instanceof Error ? eliteError.message : 'Connection failed',
          lastTest: new Date().toISOString()
        });
        console.log('❌ [TEST-ASSISTANTS] Elite Assistant error:', eliteError);
      }
    } else {
      testResults.push({
        name: 'Elite Assistant',
        status: 'major',
        error: 'Assistant ID or API key not configured',
        lastTest: new Date().toISOString()
      });
      console.log('⚠️ [TEST-ASSISTANTS] Elite Assistant not configured');
    }
    
    // Test Standard Assistant (if different from Elite)
    if (process.env.OPENAI_ASSISTANT_STANDARD && process.env.OPENAI_ASSISTANT_STANDARD !== process.env.OPENAI_ASSISTANT_ELITE) {
      console.log('📊 [TEST-ASSISTANTS] Testing Standard Assistant...');
      try {
        const standardStartTime = Date.now();
        
        const response = await fetch('https://api.openai.com/v1/assistants/' + process.env.OPENAI_ASSISTANT_STANDARD, {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
            'OpenAI-Beta': 'assistants=v2'
          },
          signal: AbortSignal.timeout(10000)
        });
        
        const standardResponseTime = Date.now() - standardStartTime;
        
        if (response.ok) {
          const assistantData = await response.json();
          testResults.push({
            name: 'Standard Assistant',
            status: 'operational',
            responseTime: standardResponseTime,
            assistantId: process.env.OPENAI_ASSISTANT_STANDARD.substring(0, 10) + '...',
            model: assistantData.model || 'unknown',
            lastTest: new Date().toISOString()
          });
          console.log('✅ [TEST-ASSISTANTS] Standard Assistant test passed');
        } else {
          testResults.push({
            name: 'Standard Assistant',
            status: 'degraded',
            responseTime: standardResponseTime,
            error: `HTTP ${response.status}`,
            lastTest: new Date().toISOString()
          });
          console.log('⚠️ [TEST-ASSISTANTS] Standard Assistant test failed:', response.status);
        }
        
      } catch (standardError) {
        testResults.push({
          name: 'Standard Assistant',
          status: 'major',
          error: standardError instanceof Error ? standardError.message : 'Connection failed',
          lastTest: new Date().toISOString()
        });
        console.log('❌ [TEST-ASSISTANTS] Standard Assistant error:', standardError);
      }
    }
    
    // Test OpenAI API connectivity
    console.log('🔗 [TEST-ASSISTANTS] Testing OpenAI API connectivity...');
    try {
      const apiStartTime = Date.now();
      
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY
        },
        signal: AbortSignal.timeout(5000)
      });
      
      const apiResponseTime = Date.now() - apiStartTime;
      
      if (response.ok) {
        testResults.push({
          name: 'OpenAI API',
          status: 'operational',
          responseTime: apiResponseTime,
          lastTest: new Date().toISOString()
        });
        console.log('✅ [TEST-ASSISTANTS] OpenAI API test passed');
      } else {
        testResults.push({
          name: 'OpenAI API',
          status: 'degraded',
          responseTime: apiResponseTime,
          error: `HTTP ${response.status}`,
          lastTest: new Date().toISOString()
        });
        console.log('⚠️ [TEST-ASSISTANTS] OpenAI API test failed:', response.status);
      }
      
    } catch (apiError) {
      testResults.push({
        name: 'OpenAI API',
        status: 'major',
        error: apiError instanceof Error ? apiError.message : 'API connection failed',
        lastTest: new Date().toISOString()
      });
      console.log('❌ [TEST-ASSISTANTS] OpenAI API error:', apiError);
    }
    
    const totalProcessingTime = Date.now() - startTime;
    
    // Calculate summary
    const totalTests = testResults.length;
    const passedTests = testResults.filter(r => r.status === 'operational').length;
    const failedTests = testResults.filter(r => r.status === 'major').length;
    const degradedTests = testResults.filter(r => r.status === 'degraded').length;
    
    console.log('🎯 [TEST-ASSISTANTS] Testing completed');
    console.log(`📊 [TEST-ASSISTANTS] ${passedTests}/${totalTests} tests passed`);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processingTime: totalProcessingTime + 'ms',
      summary: {
        totalTests,
        passedTests,
        failedTests,
        degradedTests,
        overallStatus: failedTests > 0 ? 'major' : degradedTests > 0 ? 'degraded' : 'operational'
      },
      results: testResults
    });
    
  } catch (error) {
    console.error('❌ [TEST-ASSISTANTS] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Assistant testing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
