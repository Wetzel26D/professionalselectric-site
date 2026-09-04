(() => {
  'use strict';

  const allowed = new Set(['call_click', 'text_click', 'email_click', 'estimate_click', 'form_success']);

  function track(type) {
    if (!allowed.has(type)) return;
    const payload = JSON.stringify({ type, page: location.pathname });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/event', new Blob([payload], { type: 'application/json' }));
      return;
    }
    fetch('/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
  }

  window.peTrack = track;

  if (location.hostname === 'professionalselectric.com' || location.hostname === 'www.professionalselectric.com') {
    const insights = document.createElement('script');
    insights.src = '/_vercel/insights/script.js';
    insights.defer = true;
    document.head.append(insights);
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (href.startsWith('tel:')) track('call_click');
    else if (href.startsWith('sms:')) track('text_click');
    else if (href.startsWith('mailto:')) track('email_click');
    else if (/contact\.html(?:$|[?#])/.test(href)) track('estimate_click');
  });
})();
