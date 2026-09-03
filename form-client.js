import { upload } from '@vercel/blob/client';

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 25 * 1024 * 1024;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

function readableSize(bytes) {
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function safeFilename(filename) {
  return filename.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(-160) || 'project-photo';
}

function recordSubmission() {
  try {
    const key = 'professionals-electric-interactions';
    const totals = JSON.parse(localStorage.getItem(key) || '{}');
    totals.form_submit = (totals.form_submit || 0) + 1;
    localStorage.setItem(key, JSON.stringify(totals));
  } catch (_) {
    // Local measurement never blocks a request.
  }
}

function startEstimateForm() {
  const form = document.querySelector('[data-estimate-form]');
  if (!form) return;

  const fileInput = form.querySelector('[data-photo-input]');
  const fileSummary = form.querySelector('[data-file-summary]');
  const progress = form.querySelector('[data-upload-progress]');
  const status = form.querySelector('[data-form-status]');
  const submitButton = form.querySelector('[data-submit-button]');

  function setStatus(message, kind = '') {
    status.textContent = message;
    status.dataset.kind = kind;
    status.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    status.setAttribute('aria-atomic', 'true');
  }

  function selectedFiles() {
    return [...(fileInput?.files || [])];
  }

  function validateFiles(report = false) {
    const files = selectedFiles();
    const total = files.reduce((sum, file) => sum + file.size, 0);
    let error = '';
    if (files.length > MAX_PHOTOS) error = `Choose no more than ${MAX_PHOTOS} photos.`;
    else if (files.some((file) => file.size > MAX_PHOTO_BYTES)) error = 'Each photo must be 25 MB or smaller.';
    else if (total > MAX_TOTAL_BYTES) error = 'Keep all selected photos under 100 MB combined.';
    else if (files.some((file) => file.type && !ACCEPTED_TYPES.has(file.type))) error = 'Use JPEG, PNG, WebP, HEIC, or HEIF photos.';

    fileInput.setCustomValidity(error);
    if (report && error) fileInput.reportValidity();
    fileSummary.textContent = files.length
      ? `${files.length} photo${files.length === 1 ? '' : 's'} selected — ${readableSize(total)} total${error ? `. ${error}` : ''}`
      : 'No photos selected.';
    fileSummary.dataset.kind = error ? 'error' : '';
    return !error;
  }

  fileInput?.addEventListener('change', () => validateFiles(true));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity() || !validateFiles(true)) return;

    const submissionId = crypto.randomUUID();
    const files = selectedFiles();
    submitButton.disabled = true;
    form.setAttribute('aria-busy', 'true');
    submitButton.textContent = files.length ? 'Uploading photos…' : 'Sending request…';
    progress.hidden = files.length === 0;
    progress.value = 0;
    progress.max = Math.max(files.length, 1) * 100;
    setStatus(files.length ? `Uploading 1 of ${files.length}…` : 'Securely sending your request…');

    try {
      const uploadedPhotos = [];
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        setStatus(`Uploading photo ${index + 1} of ${files.length}…`);
        const blob = await upload(`requests/${submissionId}/${safeFilename(file.name)}`, file, {
          access: 'private',
          handleUploadUrl: '/api/upload',
          clientPayload: JSON.stringify({ submissionId }),
          onUploadProgress: ({ percentage }) => {
            progress.value = index * 100 + Math.round(percentage || 0);
            progress.setAttribute('aria-valuetext', `Uploading photo ${index + 1} of ${files.length}: ${Math.round(percentage || 0)} percent`);
          }
        });
        progress.value = (index + 1) * 100;
        uploadedPhotos.push({ pathname: blob.pathname, originalName: file.name });
      }

      submitButton.textContent = 'Sending request…';
      setStatus('Photos uploaded. Sending your project details…');
      const fields = new FormData(form);
      const payload = {
        submissionId,
        website: fields.get('website'),
        name: fields.get('name'),
        phone: fields.get('phone'),
        email: fields.get('email'),
        jobAddress: fields.get('job-address'),
        service: fields.get('service'),
        propertyType: fields.get('property-type'),
        message: fields.get('message'),
        companyProperty: fields.get('company-property'),
        contactRole: fields.get('contact-role'),
        deadlineInspection: fields.get('deadline-inspection'),
        accessCoordination: fields.get('access-coordination'),
        plansAvailable: fields.get('plans-available'),
        shutdownNeeded: fields.get('shutdown-needed'),
        urgent: fields.get('urgent'),
        projectTiming: fields.get('project-timing'),
        bestContactTime: fields.get('best-contact-time'),
        termsAccepted: fields.get('terms-accepted'),
        photos: uploadedPhotos
      };

      const result = await fetch('/api/submit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await result.json().catch(() => ({}));
      if (!result.ok) throw new Error(data.error || 'The request could not be sent. Please call 657-774-5017.');

      recordSubmission();
      setStatus(`Request sent. Reference ${data.reference}.`, 'success');
      form.setAttribute('aria-busy', 'false');
      location.assign(`thanks.html?ref=${encodeURIComponent(data.reference || '')}`);
    } catch (error) {
      console.error(error);
      setStatus(error?.message || 'The request could not be sent. Please call 657-774-5017.', 'error');
      submitButton.disabled = false;
      submitButton.textContent = 'Try sending again';
      form.setAttribute('aria-busy', 'false');
      status.tabIndex = -1;
      status.focus();
    }
  });
}

document.addEventListener('DOMContentLoaded', startEstimateForm);
