(() => {
  'use strict';

  const login = document.querySelector('[data-admin-login]');
  const dashboard = document.querySelector('[data-admin-dashboard]');
  const loginForm = document.querySelector('[data-admin-login-form]');
  const status = document.querySelector('[data-admin-status]');
  const metrics = document.querySelector('[data-admin-metrics]');
  const leadsRoot = document.querySelector('[data-admin-leads]');
  const updated = document.querySelector('[data-admin-updated]');
  const refresh = document.querySelector('[data-admin-refresh]');
  let accessToken = '';

  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  const formatDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const statusBadge = (value) => {
    const normalized = value || 'unknown';
    return make('span', `admin-status-badge is-${normalized}`, normalized.replaceAll('-', ' '));
  };

  function addMetric(label, value) {
    const card = make('article', 'admin-metric');
    card.append(make('strong', '', String(value)), make('span', '', label));
    metrics.append(card);
  }

  function addDetail(list, label, value, href) {
    if (!value) return;
    const row = make('div', 'admin-detail');
    row.append(make('dt', '', label));
    const description = make('dd');
    if (href) {
      const link = make('a', '', value);
      link.href = href;
      description.append(link);
    } else description.textContent = value;
    row.append(description);
    list.append(row);
  }

  function renderLead(lead) {
    const card = make('article', 'admin-lead-card');
    const header = make('div', 'admin-lead-header');
    const title = make('div');
    title.append(make('span', 'admin-reference', `#${lead.reference}`), make('h2', '', lead.name || 'Unnamed lead'), make('p', '', formatDate(lead.receivedAt)));
    const badges = make('div', 'admin-lead-badges');
    if (lead.urgent === 'Yes') badges.append(make('span', 'admin-urgent', 'Urgent'));
    badges.append(statusBadge(lead.teamNotification?.status));
    header.append(title, badges);

    const details = make('dl', 'admin-details');
    addDetail(details, 'Phone', lead.phone, lead.phone ? `tel:${lead.phone.replace(/[^0-9+]/g, '')}` : '');
    addDetail(details, 'Email', lead.email, lead.email ? `mailto:${lead.email}` : '');
    addDetail(details, 'Job address', lead.jobAddress);
    addDetail(details, 'Service', lead.service);
    addDetail(details, 'Property type', lead.propertyType);
    addDetail(details, 'Project timing', lead.projectTiming);
    addDetail(details, 'Best contact time', lead.bestContactTime);
    addDetail(details, 'Service-area page', lead.serviceArea);
    addDetail(details, 'Source', lead.source);
    addDetail(details, 'Photos', String(lead.photoCount || 0));
    addDetail(details, 'Customer confirmation', lead.customerConfirmation?.status || 'unknown');

    const message = make('div', 'admin-message');
    message.append(make('strong', '', 'Project details'), make('p', '', lead.message || 'No project description provided.'));
    card.append(header, details, message);
    return card;
  }

  function render(data) {
    metrics.replaceChildren();
    leadsRoot.replaceChildren();
    const eventCounts = data.eventCounts || {};
    addMetric('Leads shown', data.leads.length);
    addMetric('Form submissions', eventCounts.form_success || 0);
    addMetric('Call clicks', eventCounts.call_click || 0);
    addMetric('Text clicks', eventCounts.text_click || 0);
    addMetric('Estimate clicks', eventCounts.estimate_click || 0);
    updated.textContent = `Updated ${formatDate(data.generatedAt)}${data.partial ? ' · Showing the newest records' : ''}`;
    if (!data.leads.length) leadsRoot.append(make('p', 'admin-empty', 'No website leads are stored yet.'));
    else data.leads.forEach((lead) => leadsRoot.append(renderLead(lead)));
  }

  async function loadDashboard() {
    status.textContent = 'Loading private leads…';
    const response = await fetch('/api/admin/leads', { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'The dashboard could not be loaded.');
    render(data);
    login.hidden = true;
    dashboard.hidden = false;
    status.textContent = '';
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    accessToken = loginForm.elements.token.value;
    try {
      await loadDashboard();
      loginForm.reset();
    } catch (error) {
      accessToken = '';
      status.textContent = error.message;
      loginForm.elements.token.focus();
    }
  });

  refresh.addEventListener('click', async () => {
    refresh.disabled = true;
    try { await loadDashboard(); }
    catch (error) { updated.textContent = error.message; }
    finally { refresh.disabled = false; }
  });
})();
