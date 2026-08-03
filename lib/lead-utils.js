import { createHmac, timingSafeEqual } from 'node:crypto';

export const MAX_PHOTOS = 5;
export const MAX_PHOTO_BYTES = 25 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 100 * 1024 * 1024;
export const ALLOWED_PHOTO_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
]);

export function cleanText(value, maximum = 500) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, maximum);
}

export function escapeHtml(value) {
  return cleanText(value, 10000)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function validSubmissionId(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value ?? ''));
}

export function signPhoto(leadId, index) {
  const secret = process.env.PHOTO_LINK_SECRET;
  if (!secret) throw new Error('PHOTO_LINK_SECRET is not configured');
  return createHmac('sha256', secret).update(`${leadId}:${index}`).digest('base64url');
}

export function validPhotoSignature(leadId, index, supplied) {
  if (!supplied) return false;
  const expected = signPhoto(leadId, index);
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(String(supplied));
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

export function requestIp(request) {
  const forwarded = String(request.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || request.socket?.remoteAddress || 'unknown';
}

const rateBuckets = globalThis.__peRateBuckets || new Map();
globalThis.__peRateBuckets = rateBuckets;

export function withinRateLimit(key, maximum, windowMs) {
  const now = Date.now();
  const previous = rateBuckets.get(key) || [];
  const recent = previous.filter((timestamp) => now - timestamp < windowMs);
  if (recent.length >= maximum) return false;
  recent.push(now);
  rateBuckets.set(key, recent);
  if (rateBuckets.size > 1000) {
    for (const [bucketKey, timestamps] of rateBuckets) {
      if (!timestamps.some((timestamp) => now - timestamp < windowMs)) rateBuckets.delete(bucketKey);
    }
  }
  return true;
}
