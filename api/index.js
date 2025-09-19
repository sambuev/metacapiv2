// api/meta-capi.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Configuration - UPDATE THESE
  const CONFIG = {
    PIXEL_ID: '1095449885675078',
    ACCESS_TOKEN: 'EAAaEML3B6y8BPVoynyX9NCuSWbZCsIjAplXJ5lBiNzKrTshgqfOS0yvf9yjW1bdiQyK4sZBpBVsKPwjiZCTS86QPuihbsGAdBDYmzgFW1VeI24kb2fnTWwsFzTP6qGKvgFKboQiAZAeU8JXA4JDFgQKXdqC65RABGwjPqz2ZCNuBVli1ZAZADHiJvY3RISMvkaZCZAQZDZD', // ADD YOUR TOKEN HERE
    TEST_MODE: true,
    TEST_CODE: 'TEST73280'
  };
  
  try {
    const input = req.body;
    
    // Build Meta payload
    const payload = {
      data: [{
        event_name: input.event_name || 'PageView',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: input.event_source_url || req.headers.referer || 'https://example.com',
        user_data: {
          client_ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          client_user_agent: input.user_agent || req.headers['user-agent'] || 'Mozilla/5.0',
          fbp: input.fbp || null,
          fbc: input.fbc || null
        }
      }],
      access_token: CONFIG.ACCESS_TOKEN
    };
    
    // Add test code if in test mode
    if (CONFIG.TEST_MODE && CONFIG.TEST_CODE) {
      payload.test_event_code = CONFIG.TEST_CODE;
    }
    
    // Send to Meta
    const response = await fetch(`https://graph.facebook.com/v18.0/${CONFIG.PIXEL_ID}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    return res.status(200).json({
      success: response.ok,
      result: result
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
