export default async function handler(req, res) {
  const pathSegments = req.query.path || [];
  const endpoint = pathSegments.join('/');
  const targetUrl = `https://bmtcmobileapi.karnataka.gov.in/WebAPI/${endpoint}`;

  // Forward only relevant custom headers from the client
  const forwardHeaders = {};
  if (req.headers['lan']) forwardHeaders['lan'] = req.headers['lan'];
  if (req.headers['devicetype']) forwardHeaders['deviceType'] = req.headers['devicetype'];

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://nammabmtcapp.karnataka.gov.in',
        'Referer': 'https://nammabmtcapp.karnataka.gov.in/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...forwardHeaders,
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('BMTC proxy error:', err);
    res.status(502).json({ error: 'Failed to reach BMTC API' });
  }
}
