export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ===== YOUR CONFIGURATION =====
  const PIXEL_ID = '1095449885675078';
  const ACCESS_TOKEN = 'EAAaEML3B6y8BPVoynyX9NCuSWbZCsIjAplXJ5lBiNzKrTshgqfOS0yvf9yjW1bdiQyK4sZBpBVsKPwjiZCTS86QPuihbsGAdBDYmzgFW1VeI24kb2fnTWwsFzTP6qGKvgFKboQiAZAeU8JXA4JDFgQKXdqC65RABGwjPqz2ZCNuBVli1ZAZADHiJvY3RISMvkaZCZAQZDZD'; // ← ADD YOUR ACTUAL TOKEN!
  const TEST_MODE = true;
  const TEST_CODE = 'TEST73280';
  // ==============================

  // Handle GET request (when visiting in browser)
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: '✅ Meta CAPI Endpoint Ready',
      message: 'Send POST requests to track events',
      endpoint: 'https://metacapiv2.vercel.app/api',
      pixel_id: PIXEL_ID,
      test_mode: TEST_MODE,
      instructions: 'Add this endpoint to your tracking code'
    });
  }

  // Handle POST request (actual tracking)
  if (req.method === 'POST') {
    const processEvent = async () => {
      try {
        // Check if body exists
        if (!req.body) {
          return res.status(400).json({
            success: false,
            error: 'No data received'
          });
        }

        const input = req.body;
        
        // Build Meta CAPI payload
        const eventData = {
          event_name: input.event_name || 'PageView',
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: input.event_source_url || 'https://clients.thekey.properties/welcome',
          user_data: {
            client_ip_address: (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1').split(',')[0].trim(),
            client_user_agent: input.user_agent || req.headers['user-agent'] || 'Mozilla/5.0',
            fbp: input.fbp || null,
            fbc: input.fbc || null
          }
        };

        // Add custom data if provided
        if (input.custom_data) {
          eventData.custom_data = input.custom_data;
        }

        // Build final payload
        const payload = {
          data: [eventData],
          access_token: ACCESS_TOKEN
        };

        // Add test code if in test mode
        if (TEST_MODE && TEST_CODE) {
          payload.test_event_code = TEST_CODE;
        }

        // Check if access token is set
        if (ACCESS_TOKEN === 'YOUR_ACCESS_TOKEN_HERE') {
          return res.status(400).json({
            success: false,
            error: '⚠️ Access Token not configured! Add your Meta Access Token in the code.'
          });
        }

        // Send to Meta
        const metaResponse = await fetch(
          `https://graph.facebook.com/v18.0/${PIXEL_ID}/events`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }
        );

        const result = await metaResponse.json();

        // Return response
        return res.status(200).json({
          success: metaResponse.ok,
          message: metaResponse.ok ? '✅ Event sent to Meta successfully' : '❌ Failed to send to Meta',
          event_name: eventData.event_name,
          test_mode: TEST_MODE,
          result: result
        });

      } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
          success: false,
          error: error.message || 'Internal server error'
        });
      }
    };

    return processEvent();
  }

  // Other methods not allowed
  return res.status(405).json({ 
    error: 'Method not allowed. Use GET to test or POST to send events.' 
  });
}
