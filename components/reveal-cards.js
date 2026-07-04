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
    // /servicios/* nuevas (ficha técnica .sv-*)
    '.sv-module',
    '.sv-bom-row',
    '.sv-step',
    // Home (/)
    '.srv-card',
    '.proc-step',
    '.plan-card',
    '.testi-card',
    // /casos-de-exito/* (case studies)
    '.cs-feature',
    '.cs-step',
    '.cs-result',
    '.csx-card'
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

  // Muro de portafolio: en touch enciende color (.port-card--lit) mientras la
  // card cruza una banda central del viewport; se apaga al salir. Distinto del
  // reveal one-shot de arriba → observer propio, toggle on/off.
  function initPortWall() {
    var cards = document.querySelectorAll('.port-card');
    if (!cards.length) return;

    // rootMargin recorta el viewport a una banda central (~16% de alto): la card
    // sólo "intersecta" cuando está a la mitad de la pantalla.
    var wall = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        entries[i].target.classList.toggle('port-card--lit', entries[i].isIntersecting);
      }
    }, { rootMargin: '-42% 0px -42% 0px', threshold: 0 });

    for (var k = 0; k < cards.length; k++) wall.observe(cards[k]);
  }

  function boot() { init(); initPortWall(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
