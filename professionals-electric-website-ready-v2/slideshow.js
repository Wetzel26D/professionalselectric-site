(() => {
  'use strict';

  const photoSets = {
    'index.html': ['_DSC6832.webp', '_DSC6960.webp', '_DSC7004.webp', '_DSC6947.webp', '_DSC7024.webp', '_DSC7056.webp'],
    'residential.html': ['_DSC7004.webp', '_DSC7013.webp', '_DSC7021.webp', '_DSC7042.webp', '_DSC7051.webp', '_DSC7056.webp'],
    'commercial.html': ['_DSC6960.webp', '_DSC6975.webp', '_DSC6988.webp', '_DSC6991.webp', '_DSC7024.webp', '_DSC7046.webp'],
    'industrial.html': ['_DSC6838.webp', '_DSC6856.webp', '_DSC6887.webp', '_DSC6906.webp', '_DSC6919.webp', '_DSC6929.webp'],
    'panels.html': ['_DSC6947.webp', '_DSC6950.webp', '_DSC6955.webp', '_DSC6964.webp', '_DSC6991.webp', '_DSC7021.webp'],
    'ev-chargers.html': ['_DSC7056.webp', '_DSC7042.webp', '_DSC7004.webp', '_DSC7013.webp', '_DSC7024.webp', '_DSC6960.webp'],
    'emergency.html': ['_DSC6906.webp', '_DSC6919.webp', '_DSC6929.webp', '_DSC6932.webp', '_DSC6941.webp', '_DSC6942.webp'],
    'residential-commercial.html': ['_DSC6988.webp', '_DSC7004.webp', '_DSC6960.webp', '_DSC7021.webp', '_DSC7042.webp', '_DSC7051.webp'],
    'gallery.html': ['_DSC6991.webp', '_DSC6832.webp', '_DSC6906.webp', '_DSC6975.webp', '_DSC7024.webp', '_DSC7056.webp'],
    'about.html': ['_DSC7048.webp', '_DSC7046.webp', '_DSC6895.webp', '_DSC7004.webp', '_DSC7024.webp', '_DSC7056.webp'],
    'contact.html': ['_DSC7042.webp', '_DSC6947.webp', '_DSC6960.webp', '_DSC7004.webp', '_DSC7024.webp', '_DSC7056.webp'],
    'service-areas.html': ['_DSC7024.webp', '_DSC6960.webp', '_DSC7004.webp', '_DSC7042.webp', '_DSC6991.webp', '_DSC7056.webp'],
    'project-highlights.html': ['_DSC6838.webp', '_DSC6906.webp', '_DSC6975.webp', '_DSC7024.webp', '_DSC7048.webp', '_DSC7056.webp']
  };

  const pageName = location.pathname.split('/').pop() || 'index.html';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const imagePath = (name) => `slideshow-webp/${name}`;

  function buildHeroSlideshow(hero) {
    if (!hero || hero.dataset.ready === 'true') return;
    hero.dataset.ready = 'true';
    const photos = photoSets[pageName] || photoSets['index.html'];

    const stage = document.createElement('div');
    stage.className = 'hero-bg-slideshow';
    stage.setAttribute('aria-hidden', 'true');

    const first = document.createElement('img');
    first.className = 'hero-bg-photo is-active';
    first.src = imagePath(photos[0]);
    first.alt = '';
    first.decoding = 'async';
    first.fetchPriority = 'high';
    stage.appendChild(first);
    hero.prepend(stage);

    if (reduceMotion || photos.length < 2) return;

    const standby = document.createElement('img');
    standby.className = 'hero-bg-photo';
    standby.alt = '';
    standby.decoding = 'async';
    stage.appendChild(standby);

    let active = first;
    let incoming = standby;
    let index = 1;
    let timer;

    const loadIncoming = () => {
      incoming.src = imagePath(photos[index]);
      incoming.loading = 'eager';
    };

    const advance = () => {
      if (!incoming.complete || incoming.naturalWidth === 0) return;
      active.classList.remove('is-active');
      incoming.classList.add('is-active');
      const previous = active;
      active = incoming;
      incoming = previous;
      index = (index + 1) % photos.length;
      window.setTimeout(loadIncoming, 900);
    };

    const start = () => {
      loadIncoming();
      timer = window.setInterval(advance, 4600);
    };

    const startWhenQuiet = () => {
      if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1200 });
      else window.setTimeout(start, 250);
    };

    if (document.readyState === 'complete') startWhenQuiet();
    else window.addEventListener('load', startWhenQuiet, { once: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && timer) {
        clearInterval(timer);
        timer = undefined;
      } else if (!document.hidden && !timer) {
        timer = window.setInterval(advance, 4600);
      }
    });
  }

  function buildExpandedFooter() {
    const footer = document.querySelector('.footer');
    if (!footer || footer.querySelector('.footer-expanded')) return;
    footer.innerHTML = `<div class="wrap footer-expanded">
      <div class="footer-brand"><img src="logo-primary-v3.png" width="480" height="480" alt="Professionals Electric logo"><p>Residential, commercial, and industrial electrical services across Orange County.</p></div>
      <nav aria-label="Footer navigation"><strong>Company</strong><a href="about.html">About Our Team</a><a href="gallery.html">Project Gallery</a><a href="project-highlights.html">Field Work Highlights</a><a href="service-areas.html">Service Areas</a><a href="contact.html">Request an Estimate</a><a href="privacy.html">Privacy</a></nav>
      <div><strong>Contact</strong><a href="tel:6577745017">657-774-5017</a><a href="sms:6577745017">Text the team</a><a href="mailto:shawn@professionalselectric.com">shawn@professionalselectric.com</a><span>Orange County, California</span><a href="https://www.google.com/maps/search/?api=1&query=Professionals%20Electric%20LLC%20Orange%20County%20CA" target="_blank" rel="noopener">Find Professionals Electric on Google</a></div>
    </div><div class="wrap footer-bottom">© 2026 Professionals Electric LLC</div>`;
  }

  function buildGalleryViewer() {
    const figures = [...document.querySelectorAll('.gallery-masonry figure')];
    if (!figures.length) return;
    const projects = [
      ['controls', 'Variable-frequency drive inspection'], ['testing', 'Industrial control cabinet testing'],
      ['equipment', 'Electrical equipment service'], ['controls', 'Control cabinet inspection'],
      ['testing', 'PLC and control-system diagnostics'], ['crew', 'Field troubleshooting in progress'],
      ['equipment', 'Machine electrical maintenance'], ['testing', 'Control-circuit voltage testing'],
      ['controls', 'Industrial controls review'], ['equipment', 'Electrical cabinet service'],
      ['testing', 'Equipment diagnostic testing'], ['controls', 'Control-panel wiring inspection'],
      ['equipment', 'Machine power and controls support'], ['crew', 'Crew member completing equipment service'],
      ['testing', 'Electrical testing at distribution equipment'], ['equipment', 'Industrial electrical maintenance'],
      ['controls', 'Control and power equipment inspection'], ['crew', 'Crew reviewing electrical equipment']
    ];

    figures.forEach((figure, index) => {
      const project = projects[index] || ['equipment', 'Industrial electrical project'];
      figure.dataset.category = project[0];
      if (!figure.querySelector('figcaption')) {
        const caption = document.createElement('figcaption');
        caption.textContent = project[1];
        figure.appendChild(caption);
      }
      const image = figure.querySelector('img');
      image.decoding = 'async';
      const button = document.createElement('button');
      button.className = 'gallery-open';
      button.type = 'button';
      button.setAttribute('aria-label', `Enlarge ${figure.querySelector('figcaption').textContent.toLowerCase()}`);
      image.replaceWith(button);
      button.appendChild(image);
    });

    const dialog = document.createElement('dialog');
    dialog.className = 'gallery-lightbox';
    dialog.innerHTML = '<button class="lightbox-close" type="button" aria-label="Close enlarged photo">×</button><img alt=""><p></p>';
    document.body.appendChild(dialog);
    const close = () => dialog.close();
    dialog.querySelector('.lightbox-close').addEventListener('click', close);
    dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
    figures.forEach((figure) => figure.querySelector('.gallery-open').addEventListener('click', () => {
      const image = figure.querySelector('img');
      dialog.querySelector('img').src = image.src;
      dialog.querySelector('img').alt = image.alt;
      dialog.querySelector('p').textContent = figure.querySelector('figcaption').textContent;
      dialog.showModal();
    }));

    const filters = [...document.querySelectorAll('[data-gallery-filter]')];
    const status = document.querySelector('.gallery-filter-status');
    filters.forEach((filter) => filter.addEventListener('click', () => {
      const category = filter.dataset.galleryFilter;
      filters.forEach((item) => {
        const activeFilter = item === filter;
        item.classList.toggle('is-active', activeFilter);
        item.setAttribute('aria-pressed', String(activeFilter));
      });
      let visible = 0;
      figures.forEach((figure) => {
        const show = category === 'all' || figure.dataset.category === category;
        figure.hidden = !show;
        if (show) visible += 1;
      });
      if (status) status.textContent = category === 'all'
        ? `Showing all ${visible} project photos.`
        : `Showing ${visible} ${filter.textContent.toLowerCase()} photos.`;
    }));
  }

  function buildServiceFinder() {
    const form = document.querySelector('[data-service-finder]');
    if (!form) return;
    const result = form.querySelector('[data-finder-result]');
    const routes = {
      'home|repair': ['Residential electrical', 'residential.html', 'Home repairs, outlets, lighting, circuits, and troubleshooting.', 'Home'],
      'home|panel': ['Panel work', 'panels.html', 'Panel, subpanel, breaker, and added-capacity planning.', 'Home'],
      'home|ev': ['EV prep', 'ev-chargers.html', 'Home charging circuits, routing, and load planning.', 'Home'],
      'home|urgent': ['Urgent electrical issue', 'emergency.html', 'Unsafe symptoms and urgent power problems—call first.', 'Home'],
      'business|repair': ['Commercial electrical', 'commercial.html', 'Commercial troubleshooting, lighting, repairs, and property support.', 'Business or retail'],
      'business|buildout': ['Commercial electrical', 'commercial.html', 'Tenant improvements, punch lists, and added power.', 'Business or retail'],
      'business|equipment': ['Commercial electrical', 'commercial.html', 'Dedicated circuits and equipment power for business spaces.', 'Business or retail'],
      'facility|repair': ['Industrial electrical', 'industrial.html', 'Facility troubleshooting, maintenance, and repair support.', 'Industrial facility'],
      'facility|equipment': ['Industrial electrical', 'industrial.html', 'Machine installation, equipment power, controls, and facility support.', 'Industrial facility'],
      'facility|buildout': ['Industrial electrical', 'industrial.html', 'Industrial installation and coordinated facility electrical work.', 'Industrial facility'],
      'project|buildout': ['Commercial electrical', 'commercial.html', 'A strong starting point for contractors, remodels, and coordinated scopes.', 'Construction or remodel'],
      'project|panel': ['Panel work', 'panels.html', 'Capacity, panels, subpanels, and dedicated circuit planning.', 'Construction or remodel'],
      'project|equipment': ['Industrial electrical', 'industrial.html', 'Equipment, machines, controls, and power coordination.', 'Construction or remodel']
    };

    const fallback = {
      home: ['Residential electrical', 'residential.html', 'Start with the residential service page and send the address plus photos.', 'Home'],
      business: ['Commercial electrical', 'commercial.html', 'Start with commercial service and include access, deadline, and scope notes.', 'Business or retail'],
      facility: ['Industrial electrical', 'industrial.html', 'Start with industrial service and include equipment and shutdown details.', 'Industrial facility'],
      project: ['Commercial electrical', 'commercial.html', 'Start with the project scope, plans, deadline, and job address.', 'Construction or remodel']
    };

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const property = form.elements.property.value;
      const need = form.elements.need.value;
      const recommendation = routes[`${property}|${need}`] || fallback[property];
      if (!recommendation) return;
      const [service, page, description, propertyType] = recommendation;
      const params = new URLSearchParams({ service, property: propertyType });
      result.innerHTML = `<strong>${service}</strong><span>${description}</span><a class="btn btn-primary" href="${page}">See this service</a> <a class="btn btn-secondary" href="contact.html?${params}">Send job details</a>`;
      result.focus();
    });
  }

  function recordLocalInteraction(type) {
    try {
      const key = 'professionals-electric-interactions';
      const totals = JSON.parse(localStorage.getItem(key) || '{}');
      totals[type] = (totals[type] || 0) + 1;
      localStorage.setItem(key, JSON.stringify(totals));
    } catch (_) { /* Local counts never block navigation. */ }
  }

  function prepareEstimateForm() {
    const form = document.querySelector('form[action*="formsubmit.co"]');
    if (!form) return;
    const params = new URLSearchParams(location.search);
    const next = form.querySelector('input[name="_next"]');
    if (next) next.value = `${location.origin}/thanks.html`;

    const service = form.elements.service;
    const property = form.elements['property-type'];
    if (params.get('service') && service) service.value = params.get('service');
    if (params.get('property') && property) property.value = params.get('property');

    const commercialFields = form.querySelector('[data-commercial-fields]');
    const updateCommercialFields = () => {
      if (!commercialFields) return;
      const show = ['Commercial electrical', 'Industrial electrical'].includes(service?.value)
        || ['Business or retail', 'Industrial facility', 'Property management', 'Construction or remodel'].includes(property?.value);
      commercialFields.hidden = !show;
      commercialFields.querySelectorAll('input, select, textarea').forEach((field) => { field.disabled = !show; });
    };
    service?.addEventListener('change', updateCommercialFields);
    property?.addEventListener('change', updateCommercialFields);
    updateCommercialFields();

    const attachments = [...form.querySelectorAll('input[type="file"]')];
    const validateAttachments = () => {
      const totalSize = attachments.reduce((total, input) => total + [...input.files].reduce((sum, file) => sum + file.size, 0), 0);
      const tooLarge = totalSize > 10 * 1024 * 1024;
      attachments.forEach((input) => input.setCustomValidity(tooLarge ? 'Please keep all attached photos under 10 MB combined.' : ''));
      if (tooLarge) attachments[0].reportValidity();
    };
    attachments.forEach((input) => input.addEventListener('change', validateAttachments));

    form.addEventListener('submit', () => {
      const subject = form.querySelector('input[name="_subject"]');
      if (subject && service?.value) subject.value = `New ${service.value} request - Professionals Electric`;
      recordLocalInteraction('form_submit');
    });
  }

  function enablePrivacyFriendlyTracking() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      const type = href.startsWith('tel:') ? 'phone_click'
        : href.startsWith('sms:') ? 'text_click'
        : href.includes('contact.html') || link.textContent.toLowerCase().includes('estimate') ? 'estimate_click'
        : null;
      if (type) recordLocalInteraction(type);
    });
  }

  function closeMobileMenuAfterSelection() {
    const toggle = document.querySelector('.menu-toggle');
    if (!toggle) return;
    document.querySelectorAll('.main-nav a').forEach((link) => link.addEventListener('click', () => { toggle.checked = false; }));
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-hero-slideshow]').forEach(buildHeroSlideshow);
    buildExpandedFooter();
    buildGalleryViewer();
    buildServiceFinder();
    prepareEstimateForm();
    enablePrivacyFriendlyTracking();
    closeMobileMenuAfterSelection();
  });
})();
