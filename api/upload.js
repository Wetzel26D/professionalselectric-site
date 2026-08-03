import { handleUpload } from '@vercel/blob/client';
import {
  ALLOWED_PHOTO_TYPES,
  MAX_PHOTO_BYTES,
  requestIp,
  validSubmissionId,
  withinRateLimit
} from '../lib/lead-utils.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  if (!withinRateLimit(`upload:${requestIp(request)}`, 30, 10 * 60 * 1000)) {
    return response.status(429).json({ error: 'Too many upload attempts. Please wait a few minutes or call us.' });
  }

  try {
    const result = await handleUpload({
      request,
      body: request.body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let payload;
        try {
          payload = JSON.parse(clientPayload || '{}');
        } catch {
          throw new Error('Invalid upload request.');
        }

        if (!validSubmissionId(payload.submissionId)) throw new Error('Invalid upload request.');
        if (!pathname.startsWith(`requests/${payload.submissionId}/`)) throw new Error('Invalid upload path.');

        return {
          allowedContentTypes: [...ALLOWED_PHOTO_TYPES],
          maximumSizeInBytes: MAX_PHOTO_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ submissionId: payload.submissionId })
        };
      }
    });

    return response.status(200).json(result);
  } catch (error) {
    console.error('Upload token error', error);
    return response.status(400).json({ error: error?.message || 'The photo upload could not be started.' });
  }
}
