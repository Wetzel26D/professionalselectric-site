(() => {
  const photos = [
    '_DSC6832.webp','_DSC6838.webp','_DSC6856.webp','_DSC6861.webp','_DSC6887.webp','_DSC6895.webp','_DSC6906.webp','_DSC6919.webp','_DSC6929.webp','_DSC6932.webp','_DSC6941.webp','_DSC6942.webp','_DSC6947.webp','_DSC6950.webp','_DSC6955.webp','_DSC6960.webp','_DSC6964.webp','_DSC6975.webp','_DSC6988.webp','_DSC6991.webp','_DSC7004.webp','_DSC7013.webp','_DSC7021.webp','_DSC7024.webp','_DSC7042.webp','_DSC7046.webp','_DSC7048.webp','_DSC7051.webp','_DSC7056.webp'
  ];

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shuffle = (items) => items
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);

  function buildHeroSlideshow(hero) {
    if (!hero || hero.dataset.ready === 'true') return;
    hero.dataset.ready = 'true';

    const selected = shuffle(photos).slice(0, 15);
    const stage = document.createElement('div');
    stage.className = 'hero-bg-slideshow';
    stage.setAttribute('aria-hidden', 'true');

    const slides = selected.map((name, index) => {
      const img = document.createElement('img');
      img.className = 'hero-bg-photo';
      img.src = `slideshow-webp/${name}`;
      img.alt = '';
      img.loading = index === 0 ? 'eager' : 'lazy';
      img.decoding = 'async';
      if (index === 0) img.classList.add('is-active');
      stage.appendChild(img);
      return img;
    });

    hero.prepend(stage);

    if (reduceMotion || slides.length < 2) return;

    let current = 0;
    window.setInterval(() => {
      slides[current].classList.remove('is-active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('is-active');
    }, 3400);
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-hero-slideshow]').forEach(buildHeroSlideshow);
  });
})();
