import https from 'node:https';

export default async function handler(req, res) {
  const pathSegments = req.query.path || [];
  const endpoint = pathSegments.join('/');

  // Forward only relevant custom headers from the client
  const forwardHeaders = {};
  if (req.headers['lan']) forwardHeaders['lan'] = req.headers['lan'];
  if (req.headers['devicetype']) forwardHeaders['deviceType'] = req.headers['devicetype'];

  const body = req.method !== 'GET' ? JSON.stringify(req.body) : null;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
    'Origin': 'https://nammabmtcapp.karnataka.gov.in',
    'Referer': 'https://nammabmtcapp.karnataka.gov.in/',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ...forwardHeaders,
  };

  if (body) {
    headers['Content-Length'] = Buffer.byteLength(body);
  }

  const options = {
    hostname: 'bmtcmobileapi.karnataka.gov.in',
    port: 443,
    path: `/WebAPI/${endpoint}`,
    method: req.method,
    headers,
  };

  try {
    const data = await new Promise((resolve, reject) => {
      const proxyReq = https.request(options, (proxyRes) => {
        let chunks = '';
        proxyRes.on('data', (chunk) => { chunks += chunk; });
        proxyRes.on('end', () => {
          try {
            resolve({ status: proxyRes.statusCode, body: JSON.parse(chunks) });
          } catch {
            reject(new Error(`Invalid JSON from BMTC API: ${chunks.slice(0, 200)}`));
          }
        });
      });

      proxyReq.on('error', reject);
      proxyReq.setTimeout(15000, () => {
        proxyReq.destroy();
        reject(new Error('BMTC API request timed out'));
      });

      if (body) proxyReq.write(body);
      proxyReq.end();
    });

    res.status(data.status).json(data.body);
  } catch (err) {
    console.error('BMTC proxy error:', err.message);
    res.status(502).json({ error: 'Failed to reach BMTC API', detail: err.message });
  }
}
