export default function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  return response.status(200).json({
    ok: true,
    service: 'professionals-electric-website',
    checkedAt: new Date().toISOString()
  });
}
