import { get, list } from '@vercel/blob';
import { cleanText, safeSecretEqual } from '../../lib/lead-utils.js';

async function readPrivateJson(pathname) {
  const result = await get(pathname, { access: 'private', useCache: false });
  if (!result?.stream) return null;
  const body = await new Response(result.stream).text();
  return JSON.parse(body);
}

function authorized(request) {
  const header = String(request.headers?.authorization || request.headers?.get?.('authorization') || '');
  const supplied = header.replace(/^Bearer\s+/i, '');
  return safeSecretEqual(process.env.ADMIN_DASHBOARD_TOKEN, supplied);
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed.' });
  }
  if (!process.env.ADMIN_DASHBOARD_TOKEN) {
    return response.status(503).json({ error: 'The private dashboard is not configured yet.' });
  }
  if (!authorized(request)) return response.status(401).json({ error: 'Invalid dashboard access password.' });

  try {
    const [leadListing, eventListing] = await Promise.all([
      list({ prefix: 'leads/', limit: 250 }),
      list({ prefix: 'events/', limit: 300 })
    ]);

    const leadBlobs = [...leadListing.blobs]
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      .slice(0, 100);
    const eventBlobs = [...eventListing.blobs]
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      .slice(0, 300);

    const [leadRecords, eventRecords] = await Promise.all([
      Promise.all(leadBlobs.map((blob) => readPrivateJson(blob.pathname).catch(() => null))),
      Promise.all(eventBlobs.map((blob) => readPrivateJson(blob.pathname).catch(() => null)))
    ]);

    const leads = leadRecords.filter(Boolean).map((lead) => ({
      id: cleanText(lead.id, 60),
      reference: cleanText(lead.id, 60).slice(0, 8).toUpperCase(),
      receivedAt: lead.receivedAt,
      name: cleanText(lead.name, 120),
      phone: cleanText(lead.phone, 60),
      email: cleanText(lead.email, 200),
      jobAddress: cleanText(lead.jobAddress, 300),
      service: cleanText(lead.service, 120),
      propertyType: cleanText(lead.propertyType, 120),
      message: cleanText(lead.message, 5000),
      urgent: cleanText(lead.urgent, 20),
      projectTiming: cleanText(lead.projectTiming, 120),
      bestContactTime: cleanText(lead.bestContactTime, 200),
      serviceArea: cleanText(lead.serviceArea, 120),
      source: cleanText(lead.source, 200),
      photoCount: Array.isArray(lead.photos) ? lead.photos.length : 0,
      teamNotification: lead.teamNotification || { status: 'unknown' },
      customerConfirmation: lead.customerConfirmation || { status: lead.email ? 'unknown' : 'not-requested' }
    }));

    const events = eventRecords.filter(Boolean);
    const eventCounts = events.reduce((totals, event) => {
      const type = cleanText(event.type, 50);
      if (type) totals[type] = (totals[type] || 0) + 1;
      return totals;
    }, {});

    return response.status(200).json({
      generatedAt: new Date().toISOString(),
      leads,
      eventCounts,
      trackedEvents: events.length,
      partial: Boolean(leadListing.hasMore || eventListing.hasMore)
    });
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', msg: 'admin_dashboard_failed', route: '/api/admin/leads', error: error?.message || String(error) }));
    return response.status(500).json({ error: 'The private dashboard could not be loaded.' });
  }
}
