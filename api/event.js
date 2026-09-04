import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import { cleanText, requestIp, withinRateLimit } from '../lib/lead-utils.js';

const ALLOWED_EVENTS = new Set(['call_click', 'text_click', 'email_click', 'estimate_click', 'form_success']);

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }
  if (!withinRateLimit(`event:${requestIp(request)}`, 60, 15 * 60 * 1000)) {
    return response.status(204).end();
  }

  try {
    const type = cleanText(request.body?.type, 50);
    const page = cleanText(request.body?.page, 200);
    if (!ALLOWED_EVENTS.has(type)) return response.status(400).json({ error: 'Invalid event.' });

    const now = new Date();
    const event = {
      type,
      page: page.startsWith('/') ? page : '/',
      recordedAt: now.toISOString()
    };
    const date = now.toISOString().slice(0, 10);
    await put(`events/${date}/${randomUUID()}.json`, JSON.stringify(event), {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false
    });
    return response.status(204).end();
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', msg: 'conversion_event_failed', route: '/api/event', error: error?.message || String(error) }));
    return response.status(204).end();
  }
}
