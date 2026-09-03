import { head, put } from '@vercel/blob';
import { Resend } from 'resend';
import {
  ALLOWED_PHOTO_TYPES,
  MAX_PHOTO_BYTES,
  MAX_PHOTOS,
  MAX_TOTAL_BYTES,
  cleanText,
  escapeHtml,
  requestIp,
  signPhoto,
  validSubmissionId,
  withinRateLimit
} from '../lib/lead-utils.js';

const resend = new Resend(process.env.RESEND_API_KEY);

function row(label, value) {
  if (!value) return '';
  return `<tr><th scope="row" style="padding:9px 12px;text-align:left;vertical-align:top;border-bottom:1px solid #e6e0d5;color:#5d4212;width:190px">${escapeHtml(label)}</th><td style="padding:9px 12px;border-bottom:1px solid #e6e0d5;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`;
}

async function sendLeadEmail(params, submissionId) {
  const idempotencyKey = `website-lead/${submissionId}`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await resend.emails.send(params, { idempotencyKey });
    if (!result.error) return result;
    const retryable = result.error.statusCode === 429 || result.error.statusCode >= 500;
    if (!retryable || attempt === 2) return result;
    await new Promise((resolve) => setTimeout(resolve, 500 * (2 ** attempt)));
  }
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  if (!withinRateLimit(`submit:${requestIp(request)}`, 8, 15 * 60 * 1000)) {
    return response.status(429).json({ error: 'Too many requests. Please wait a few minutes or call 657-774-5017.' });
  }

  try {
    const body = request.body || {};
    if (cleanText(body.website, 200)) return response.status(200).json({ ok: true });

    const submissionId = cleanText(body.submissionId, 50);
    const name = cleanText(body.name, 120);
    const phone = cleanText(body.phone, 60);
    const email = cleanText(body.email, 200);
    const service = cleanText(body.service, 120);
    const message = cleanText(body.message, 5000);
    const termsAccepted = cleanText(body.termsAccepted, 10);

    if (!validSubmissionId(submissionId) || !name || !phone || !service || !message) {
      return response.status(400).json({ error: 'Please complete the required name, phone, service, and project details.' });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return response.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (termsAccepted !== 'Yes') {
      return response.status(400).json({ error: 'Please agree to the Website Terms and acknowledge the Privacy Policy.' });
    }

    const incomingPhotos = Array.isArray(body.photos) ? body.photos.slice(0, MAX_PHOTOS) : [];
    if ((body.photos || []).length > MAX_PHOTOS) return response.status(400).json({ error: `Please attach no more than ${MAX_PHOTOS} photos.` });

    const photos = [];
    let totalBytes = 0;
    for (const photo of incomingPhotos) {
      const pathname = cleanText(photo.pathname, 1000);
      if (!pathname.startsWith(`requests/${submissionId}/`)) throw new Error('One uploaded photo did not match this request.');
      const details = await head(pathname);
      if (!ALLOWED_PHOTO_TYPES.has(details.contentType) || details.size > MAX_PHOTO_BYTES) {
        throw new Error('One uploaded file is not a supported photo or is larger than 25 MB.');
      }
      totalBytes += details.size;
      photos.push({
        pathname: details.pathname,
        url: details.url,
        contentType: details.contentType,
        size: details.size,
        originalName: cleanText(photo.originalName, 240) || 'project-photo'
      });
    }
    if (totalBytes > MAX_TOTAL_BYTES) return response.status(400).json({ error: 'Please keep all attached photos under 100 MB combined.' });

    const lead = {
      id: submissionId,
      receivedAt: new Date().toISOString(),
      name,
      phone,
      email,
      jobAddress: cleanText(body.jobAddress, 300),
      service,
      propertyType: cleanText(body.propertyType, 120),
      message,
      companyProperty: cleanText(body.companyProperty, 200),
      contactRole: cleanText(body.contactRole, 160),
      deadlineInspection: cleanText(body.deadlineInspection, 200),
      accessCoordination: cleanText(body.accessCoordination, 2000),
      plansAvailable: cleanText(body.plansAvailable, 60),
      shutdownNeeded: cleanText(body.shutdownNeeded, 60),
      urgent: cleanText(body.urgent, 20),
      projectTiming: cleanText(body.projectTiming, 120),
      bestContactTime: cleanText(body.bestContactTime, 200),
      termsAccepted: true,
      termsVersion: '2026-09-03',
      photos,
      source: 'professionalselectric.com/contact.html'
    };

    await put(`leads/${submissionId}.json`, JSON.stringify(lead), {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false
    });

    const siteOrigin = 'https://professionalselectric.com';
    const photoLinks = photos.map((photo, index) => ({
      ...photo,
      href: `${siteOrigin}/api/photo?lead=${submissionId}&photo=${index}&token=${encodeURIComponent(signPhoto(submissionId, index))}`
    }));
    const photoHtml = photoLinks.length
      ? `<h2 style="margin:24px 0 8px">Private project photos</h2><ul>${photoLinks.map((photo, index) => `<li style="margin:8px 0"><a href="${photo.href}">Open photo ${index + 1}: ${escapeHtml(photo.originalName)}</a> (${Math.ceil(photo.size / 1024 / 1024)} MB)</li>`).join('')}</ul><p style="color:#666;font-size:13px">These links are private. Do not forward this email outside the team.</p>`
      : '<p><strong>No photos were attached.</strong></p>';

    const rows = [
      ['Name', lead.name], ['Phone', lead.phone], ['Email', lead.email], ['Job address', lead.jobAddress],
      ['Service', lead.service], ['Property type', lead.propertyType], ['Project details', lead.message],
      ['Company / property', lead.companyProperty], ['Contact role', lead.contactRole],
      ['Deadline / inspection', lead.deadlineInspection], ['Access / coordination', lead.accessCoordination],
      ['Plans available', lead.plansAvailable], ['Shutdown needed', lead.shutdownNeeded],
      ['Urgent', lead.urgent], ['Project timing', lead.projectTiming], ['Best contact time', lead.bestContactTime]
    ];
    const textRows = rows.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`).join('\n');
    const textLinks = photoLinks.map((photo, index) => `Photo ${index + 1} (${photo.originalName}): ${photo.href}`).join('\n');
    const domain = process.env.RESEND_EMAIL_DOMAIN || 'forms.professionalselectric.com';

    const { error } = await sendLeadEmail({
      from: `Professionals Electric Website <requests@${domain}>`,
      to: [process.env.LEADS_EMAIL || 'shawn@professionalselectric.com'],
      replyTo: email || undefined,
      subject: `${lead.urgent === 'Yes' ? 'URGENT — ' : ''}New ${service} request from ${name}`,
      html: `<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New Professionals Electric service request</title></head><body style="margin:0;background:#f4f1e8"><div lang="en" dir="ltr" style="font-family:Arial,sans-serif;max-width:760px;margin:0 auto;padding:18px;color:#191919"><div style="padding:18px 22px;background:#111;border-top:6px solid #d99d27;color:#fff"><h1 style="margin:0;font-size:24px">New website service request</h1><p style="margin:7px 0 0">Reference ${submissionId.slice(0, 8).toUpperCase()}</p></div><table style="width:100%;border-collapse:collapse;background:#fff9ed">${rows.map(([label, value]) => row(label, value)).join('')}</table>${photoHtml}<p style="margin-top:24px;color:#595959;font-size:13px">Received ${escapeHtml(new Date(lead.receivedAt).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))} Pacific time from professionalselectric.com.</p></div></body></html>`,
      text: `New Professionals Electric website request\nReference: ${submissionId.slice(0, 8).toUpperCase()}\n\n${textRows}\n\n${textLinks || 'No photos attached.'}`
    }, submissionId);

    if (error) {
      console.error('Resend delivery error', error);
      return response.status(502).json({ error: `Your details were saved as reference ${submissionId.slice(0, 8).toUpperCase()}, but the email notification could not be delivered. Please call 657-774-5017.` });
    }

    return response.status(200).json({ ok: true, reference: submissionId.slice(0, 8).toUpperCase() });
  } catch (error) {
    console.error('Lead submission error', error);
    return response.status(500).json({ error: error?.message || 'The request could not be sent. Please call 657-774-5017.' });
  }
}
