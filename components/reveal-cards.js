/**
 * Cero Studio · Reveal Cards on Scroll (mobile/touch fallback for :hover)
 *
 * En desktop las cards brutalist (.ab-step, .benefit-card, etc.) tienen
 * :hover que dispara la lime line slide-in + background lift + título lime.
 * En touch devices no hay hover. Este script añade clase `.in-view` cuando
 * la card entra en el viewport para que la misma animación dispare al scroll.
 *
 * CSS pattern (debe existir en cada stylesheet relevante):
 *   @media (hover: none) {
 *     .ab-step.in-view::before { transform: scaleX(1); }
 *     .ab-step.in-view { background: var(--surface-low); }
 *     .ab-step.in-view .ab-step-t { color: var(--lime); }
 *   }
 *
 * Uso: <script src="/components/reveal-cards.js" defer></script>
 */
(function () {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (!window.IntersectionObserver) return;
  // Solo aplicar en touch devices — desktop ya tiene :hover
  if (!window.matchMedia('(hover: none)').matches) return;

  // Selectors de cards brutalist/hover-treatment en todo el sitio
  var SELECTORS = [
    // /nosotros/ + /en/about-us/
    '.ab-step',
    '.ab-row',
    '.ab-stakes-card',
    '.ab-empathy',
    '.ab-timeline-coda',
    // /servicios/* + /diseno-web-para-clinicas/
    '.benefit-card',
    '.process-step',
    '.includes-item',
    '.lp-related-card',
    // Home (/)
    '.srv-card',
    '.proc-step',
    '.plan-card'
  ].join(',');

  function init() {
    var els = document.querySelectorAll(SELECTORS);
    if (!els.length) return;

    var observer = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      }
    }, {
      threshold: 0.25,
      rootMargin: '0px 0px -10% 0px' // dispara un poco antes de que esté full visible
    });

    for (var j = 0; j < els.length; j++) {
      observer.observe(els[j]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
