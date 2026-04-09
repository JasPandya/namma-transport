export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const url = new URL(request.url);
  // Extract the BMTC endpoint from the path: /api/bmtc/SearchRoute_v2 -> SearchRoute_v2
  const endpoint = url.pathname.replace(/^\/api\/bmtc\/?/, '');
  const targetUrl = `https://bmtcmobileapi.karnataka.gov.in/WebAPI/${endpoint}`;

  // Forward relevant custom headers
  const forwardHeaders = {};
  const lan = request.headers.get('lan');
  const deviceType = request.headers.get('devicetype');
  if (lan) forwardHeaders['lan'] = lan;
  if (deviceType) forwardHeaders['deviceType'] = deviceType;

  const body = request.method !== 'GET' ? await request.text() : null;

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://nammabmtcapp.karnataka.gov.in',
        'Referer': 'https://nammabmtcapp.karnataka.gov.in/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...forwardHeaders,
      },
      body,
    });

    const data = await response.text();
    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to reach BMTC API', detail: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
