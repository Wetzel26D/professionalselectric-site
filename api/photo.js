import { list } from '@vercel/blob';
import { validPhotoSignature, validSubmissionId } from '../lib/lead-utils.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).send('Method not allowed.');
  }

  const leadId = String(request.query.lead || '');
  const index = Number.parseInt(String(request.query.photo || ''), 10);
  const token = String(request.query.token || '');
  if (!validSubmissionId(leadId) || !Number.isInteger(index) || index < 0 || index > 4 || !validPhotoSignature(leadId, index, token)) {
    return response.status(404).send('Photo not found.');
  }

  try {
    const pathname = `leads/${leadId}.json`;
    const { blobs } = await list({ prefix: pathname, limit: 1 });
    const record = blobs.find((blob) => blob.pathname === pathname);
    if (!record) return response.status(404).send('Photo not found.');

    const recordResponse = await fetch(record.url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
    });
    if (!recordResponse.ok) throw new Error('Lead record could not be read.');
    const lead = await recordResponse.json();
    const photo = lead.photos?.[index];
    if (!photo?.url) return response.status(404).send('Photo not found.');

    const photoResponse = await fetch(photo.url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
    });
    if (!photoResponse.ok) throw new Error('Photo could not be read.');

    response.setHeader('Content-Type', photo.contentType || 'application/octet-stream');
    response.setHeader('Content-Disposition', `inline; filename="${String(photo.originalName || 'project-photo').replace(/["\\\r\n]/g, '_')}"`);
    response.setHeader('Cache-Control', 'private, no-store');
    const bytes = Buffer.from(await photoResponse.arrayBuffer());
    return response.status(200).send(bytes);
  } catch (error) {
    console.error('Private photo error', error);
    return response.status(404).send('Photo not found.');
  }
}
