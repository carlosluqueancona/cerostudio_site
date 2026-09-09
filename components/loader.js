(function () {
  /* Fallback SIN SSR (el middleware inyecta los partials reales; esto solo corre
     si aquello falla). Detecta /en/ para no servir navbar/footer en español en
     las páginas en inglés. */
  var IS_EN = window.location.pathname.indexOf('/en/') === 0;

  /* WhatsApp por defecto (SB7: el cliente pide ayuda para elegir) y SVG del
     ícono; los usan el menú móvil, el flotante y la barra móvil. */
  var WA_ES = 'https://wa.me/525531007101?text=Hola%2C%20quiero%20un%20sitio%20que%20venda%20para%20mi%20negocio.%20%C2%BFMe%20ayudas%20a%20elegir%20el%20plan%20correcto%3F';
  var WA_EN = 'https://wa.me/525531007101?text=Hi%2C%20I%20want%20a%20website%20that%20sells%20for%20my%20business.%20Can%20you%20help%20me%20pick%20the%20right%20plan%3F';
  var WA_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" aria-hidden="true"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>';
  var WA_DATA = ' data-wa-es="' + WA_ES + '" data-wa-en="' + WA_EN + '" target="_blank" rel="noopener"';

  var NAVBAR_ES = '<div id="mobileNav">' +
    '<a href="/#servicios" id="mnav-servicios">Servicios</a>' +
    '<a href="/#portafolio" id="mnav-portafolio">Portafolio</a>' +
    '<a href="/casos-de-exito/" id="mnav-casos">Casos de éxito</a>' +
    '<a href="/#nosotros" id="mnav-nosotros">Nosotros</a>' +
    '<a href="/#precios" id="mnav-precios">Precios</a>' +
    '<a href="/#contacto" id="mnav-contacto">Contacto</a>' +
    '<a href="/blog/" id="mnav-blog">Blog</a>' +
    '<a href="/#contacto" class="mnav-cta ht" id="mnav-cta">Iniciar Proyecto</a>' +
    '<a href="' + WA_ES + '"' + WA_DATA + ' class="mnav-wa ht" id="mnav-wa">WhatsApp directo</a>' +
    '<button id="mnav-lang" class="lang-btn-mobile ht">EN</button>' +
    '</div>' +
    '<nav id="navbar">' +
    '<a href="/" class="ht"><img src="/images/svg/Cero_Studio_AI_Horizontal.svg" alt="Cero Studio" class="nav-logo"></a>' +
    '<ul class="nav-links">' +
    '<li><a href="/#servicios" class="ht" id="nav-servicios">Servicios</a></li>' +
    '<li><a href="/#portafolio" class="ht" id="nav-portafolio">Portafolio</a></li>' +
    '<li><a href="/casos-de-exito/" class="ht" id="nav-casos">Casos</a></li>' +
    '<li><a href="/#nosotros" class="ht" id="nav-nosotros">Nosotros</a></li>' +
    '<li><a href="/#precios" class="ht" id="nav-precios">Precios</a></li>' +
    '<li><a href="/#contacto" class="ht" id="nav-contacto">Contacto</a></li>' +
    '<li><a href="/blog/" class="ht" id="nav-blog">Blog</a></li>' +
    '</ul>' +
    '<button id="langToggle" class="lang-btn ht">EN</button>' +
    '<a href="/#contacto" class="nav-cta ht" id="nav-cta">Iniciar Proyecto</a>' +
    '<div class="nav-ham ht" id="navHam"><span></span><span></span><span></span></div>' +
    '</nav>';

  var NAVBAR_EN = '<div id="mobileNav">' +
    '<a href="/en/#servicios" id="mnav-servicios">Services</a>' +
    '<a href="/en/#portafolio" id="mnav-portafolio">Portfolio</a>' +
    '<a href="/en/about-us/" id="mnav-nosotros">About</a>' +
    '<a href="/en/#precios" id="mnav-precios">Pricing</a>' +
    '<a href="/en/#contacto" id="mnav-contacto">Contact</a>' +
    '<a href="/blog/" id="mnav-blog">Blog (Spanish)</a>' +
    '<a href="/en/#contacto" class="mnav-cta ht" id="mnav-cta">Start Your Project</a>' +
    '<a href="' + WA_EN + '"' + WA_DATA + ' class="mnav-wa ht" id="mnav-wa">WhatsApp us directly</a>' +
    '<button id="mnav-lang" class="lang-btn-mobile ht">ES</button>' +
    '</div>' +
    '<nav id="navbar">' +
    '<a href="/en/" class="ht"><img src="/images/svg/Cero_Studio_AI_Horizontal.svg" alt="Cero Studio" class="nav-logo"></a>' +
    '<ul class="nav-links">' +
    '<li><a href="/en/#servicios" class="ht" id="nav-servicios">Services</a></li>' +
    '<li><a href="/en/#portafolio" class="ht" id="nav-portafolio">Portfolio</a></li>' +
    '<li><a href="/en/case-studies/" class="ht" id="nav-casos">Case Studies</a></li>' +
    '<li><a href="/en/about-us/" class="ht" id="nav-nosotros">About</a></li>' +
    '<li><a href="/en/#precios" class="ht" id="nav-precios">Pricing</a></li>' +
    '<li><a href="/en/#contacto" class="ht" id="nav-contacto">Contact</a></li>' +
    '<li><a href="/blog/" class="ht" id="nav-blog">Blog (Spanish)</a></li>' +
    '</ul>' +
    '<button id="langToggle" class="lang-btn ht active-en">ES</button>' +
    '<a href="/en/#contacto" class="nav-cta ht" id="nav-cta">Start Your Project</a>' +
    '<div class="nav-ham ht" id="navHam"><span></span><span></span><span></span></div>' +
    '</nav>';

  var FOOTER_ES = '<footer>' +
    '<div class="footer-inner"><div class="footer-top">' +
    '<div><img src="/images/svg/Cero_Studio_AI.svg" alt="Cero Studio" class="footer-logo-img" width="1434" height="742">' +
    '<p class="footer-tagline" id="footer-tagline">Diseñamos el futuro digital de tu negocio.</p></div>' +
    '<div><p class="footer-col-title" id="fcol-nav-title">Navegación</p>' +
    '<ul class="footer-links" id="fcol-nav-links">' +
    '<li><a href="/#servicios" id="fnav-srv">Servicios</a></li>' +
    '<li><a href="/#portafolio" id="fnav-port">Portafolio</a></li>' +
    '<li><a href="/auditoria-gratis/" id="fnav-audit">Auditoría gratis</a></li>' +
    '<li><a href="/recursos/" id="fnav-rec">Recursos gratis</a></li>' +
    '<li><a href="/#nosotros" id="fnav-nos">Nosotros</a></li>' +
    '<li><a href="/#proceso" id="fnav-proc">Proceso</a></li>' +
    '<li><a href="/#contacto" id="fnav-contact">Contacto</a></li>' +
    '<li><a href="/blog/" id="fnav-blog">Blog</a></li>' +
    '<li><a href="/privacidad/" id="fnav-privacy">Privacidad y Cookies</a></li>' +
    '</ul></div>' +
    '<div><p class="footer-col-title" id="fcol-srv-title">Servicios</p>' +
    '<ul class="footer-links">' +
    '<li><a href="/servicios/desarrollo-web/" id="fsrv-1">Desarrollo Web</a></li>' +
    '<li><a href="/servicios/tiendas-ecommerce/" id="fsrv-2">Tiendas eCommerce</a></li>' +
    '<li><a href="/servicios/branding-digital/" id="fsrv-3">Branding Digital</a></li>' +
    '<li><a href="/servicios/seo/" id="fsrv-4">SEO &amp; Visibilidad</a></li>' +
    '<li><a href="/servicios/mantenimiento/" id="fsrv-5">Mantenimiento</a></li>' +
    '<li><a href="/servicios/consultoria-digital/" id="fsrv-6">Consultoría Digital</a></li>' +
    '</ul></div>' +
    '<div><p class="footer-col-title" id="fcol-contact-title">Contacto</p>' +
    '<ul class="footer-links">' +
    '<li><a href="https://calendar.app.google/Mk3sTdFWsaaaUNnj6" target="_blank" rel="noopener">Agendar llamada</a></li>' +
    '<li><a href="https://wa.me/525531007101?text=Hola%2C%20me%20interesa%20m%C3%A1s%20informaci%C3%B3n%20sobre%20sus%20servicios." target="_blank" rel="noopener" id="ffoot-wa">WhatsApp</a></li>' +
    '<li><a href="mailto:hola@cerostudio.ai">hola@cerostudio.ai</a></li>' +
    '<li><a href="https://www.instagram.com/cerostudioai" target="_blank" rel="noopener">Instagram</a></li>' +
    /* '<li><a href="https://linkedin.com/company/cerostudio" target="_blank" rel="noopener">LinkedIn</a></li>' + */
    '</ul></div>' +
    '</div>' +
    '<div class="footer-bottom">' +
    '<p class="footer-copy" id="footer-copy">\u00a9 2026 Cero Studio. Todos los derechos reservados.</p>' +
    '<p class="footer-credit" id="footer-credit">Hecho con <span>\u2665</span> para emprendedores</p>' +
    '</div></div></footer>' +
    /* WhatsApp flotante (desktop) + barra de acción móvil (≤768px) */
    '<a href="' + WA_ES + '"' + WA_DATA + ' class="float-wa ht" aria-label="Cont\u00e1ctanos por WhatsApp">' + WA_SVG + '</a>' +
    '<div class="mob-bar" id="mobBar" aria-label="Acciones r\u00e1pidas">' +
    '<a class="mob-bar-main ht" id="mob-bar-main" href="/#contacto">Cotizar mi proyecto</a>' +
    '<a class="mob-bar-wa ht" href="' + WA_ES + '"' + WA_DATA + ' aria-label="WhatsApp">' + WA_SVG + '</a>' +
    '</div>';

  var FOOTER_EN = '<footer>' +
    '<div class="footer-inner"><div class="footer-top">' +
    '<div><img src="/images/svg/Cero_Studio_AI.svg" alt="Cero Studio" class="footer-logo-img" width="1434" height="742">' +
    '<p class="footer-tagline" id="footer-tagline">We design the digital future of your business.</p></div>' +
    '<div><p class="footer-col-title" id="fcol-nav-title">Navigation</p>' +
    '<ul class="footer-links" id="fcol-nav-links">' +
    '<li><a href="/en/#servicios" id="fnav-srv">Services</a></li>' +
    '<li><a href="/en/#portafolio" id="fnav-port">Portfolio</a></li>' +
    '<li><a href="/en/case-studies/" id="fnav-casos">Case Studies</a></li>' +
    '<li><a href="/auditoria-gratis/" id="fnav-audit">Free Website Audit (form in Spanish)</a></li>' +
    '<li><a href="/recursos/" id="fnav-rec">Free Resources (Spanish)</a></li>' +
    '<li><a href="/en/about-us/" id="fnav-nos">About</a></li>' +
    '<li><a href="/en/#proceso" id="fnav-proc">Process</a></li>' +
    '<li><a href="/en/#contacto" id="fnav-contact">Contact</a></li>' +
    '<li><a href="/blog/" id="fnav-blog">Blog (Spanish)</a></li>' +
    '<li><a href="/privacidad/?lang=en" id="fnav-privacy">Privacy &amp; Cookies</a></li>' +
    '</ul></div>' +
    '<div><p class="footer-col-title" id="fcol-srv-title">Services</p>' +
    '<ul class="footer-links">' +
    '<li><a href="/en/services/web-development/" id="fsrv-1">Web Development</a></li>' +
    '<li><a href="/en/services/online-stores/" id="fsrv-2">eCommerce</a></li>' +
    '<li><a href="/en/services/digital-branding/" id="fsrv-3">Digital Branding</a></li>' +
    '<li><a href="/en/services/seo/" id="fsrv-4">SEO + AI Search</a></li>' +
    '<li><a href="/en/services/web-maintenance/" id="fsrv-5">Maintenance</a></li>' +
    '<li><a href="/en/services/digital-consulting/" id="fsrv-6">Digital Consulting</a></li>' +
    '</ul></div>' +
    '<div><p class="footer-col-title" id="fcol-contact-title">Contact</p>' +
    '<ul class="footer-links">' +
    '<li><a href="https://calendar.app.google/Mk3sTdFWsaaaUNnj6" target="_blank" rel="noopener">Schedule a call</a></li>' +
    '<li><a href="https://wa.me/525531007101?text=Hi%2C%20I%27d%20like%20more%20information%20about%20your%20services." target="_blank" rel="noopener" id="ffoot-wa">WhatsApp</a></li>' +
    '<li><a href="mailto:hola@cerostudio.ai">hola@cerostudio.ai</a></li>' +
    '<li><a href="https://www.instagram.com/cerostudioai" target="_blank" rel="noopener">Instagram</a></li>' +
    '</ul></div>' +
    '</div>' +
    '<div class="footer-bottom">' +
    '<p class="footer-copy" id="footer-copy">\u00a9 2026 Cero Studio. All rights reserved.</p>' +
    '<p class="footer-credit" id="footer-credit">Made with <span>\u2665</span> for visionary businesses</p>' +
    '</div></div></footer>' +
    /* WhatsApp flotante (desktop) + barra de acción móvil (≤768px) */
    '<a href="' + WA_EN + '"' + WA_DATA + ' class="float-wa ht" aria-label="Contact us on WhatsApp">' + WA_SVG + '</a>' +
    '<div class="mob-bar" id="mobBar" aria-label="Quick actions">' +
    '<a class="mob-bar-main ht" id="mob-bar-main" href="/en/#contacto">Get a quote</a>' +
    '<a class="mob-bar-wa ht" href="' + WA_EN + '"' + WA_DATA + ' aria-label="WhatsApp">' + WA_SVG + '</a>' +
    '</div>';

  var NAVBAR_HTML = IS_EN ? NAVBAR_EN : NAVBAR_ES;
  var FOOTER_HTML = IS_EN ? FOOTER_EN : FOOTER_ES;

  function inject(placeholder, html) {
    if (!placeholder) return;
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    while (tmp.firstChild) {
      placeholder.parentNode.insertBefore(tmp.firstChild, placeholder);
    }
    placeholder.parentNode.removeChild(placeholder);
  }

  function init() {
    var navEl = document.getElementById('navbar-placeholder');
    var ftEl  = document.getElementById('footer-placeholder');

    // Skip injection if the server-side middleware already inlined the
    // partials (visible as non-empty content inside the placeholder, or as
    // an existing <nav id="navbar"> / <footer> in the DOM). This prevents
    // double navbars/footers when SSR + client both run.
    var navAlreadyRendered = document.getElementById('navbar') ||
      (navEl && navEl.children.length > 0);
    var footerAlreadyRendered = document.querySelector('footer .footer-inner') ||
      (ftEl && ftEl.children.length > 0);

    if (!navAlreadyRendered) inject(navEl, NAVBAR_HTML);
    if (!footerAlreadyRendered) inject(ftEl, FOOTER_HTML);

    /* On either homepage (ES "/" or EN "/en/"), convert its own absolute
       anchor links to bare #anchors so navigation stays in-page */
    var p = window.location.pathname;
    if (p === '/' || p === '/index.html') {
      document.querySelectorAll('#navbar a[href^="/#"], #mobileNav a[href^="/#"], footer a[href^="/#"], .mob-bar a[href^="/#"]').forEach(function (a) {
        a.setAttribute('href', a.getAttribute('href').slice(1));
      });
    } else if (p === '/en/' || p === '/en/index.html') {
      document.querySelectorAll('#navbar a[href^="/en/#"], #mobileNav a[href^="/en/#"], footer a[href^="/en/#"], .mob-bar a[href^="/en/#"]').forEach(function (a) {
        a.setAttribute('href', a.getAttribute('href').slice(4));
      });
    }

    /* WhatsApp por página: <body data-wa="texto"> sobreescribe el mensaje por
       defecto del flotante, la barra móvil y la fila del menú móvil (también
       sus data-wa-es/en para que un sync de idioma posterior no lo pise). */
    var waText = document.body && document.body.dataset ? document.body.dataset.wa : '';
    if (waText) {
      var waHref = 'https://wa.me/525531007101?text=' + encodeURIComponent(waText);
      document.querySelectorAll('.float-wa, .mob-bar-wa, #mnav-wa').forEach(function (a) {
        a.setAttribute('href', waHref);
        a.setAttribute('data-wa-es', waHref);
        a.setAttribute('data-wa-en', waHref);
      });
    }

    /* Navbar scroll microanimation (transparent → blurred bg after 60px) y
       barra de acción móvil (#mobBar.is-on cuando el hero ya salió: > 480px) */
    var navEl2 = document.getElementById('navbar');
    var mobBar = document.getElementById('mobBar');
    if (navEl2 || mobBar) {
      var applyScrolled = function () {
        var y = window.scrollY;
        if (navEl2) navEl2.classList.toggle('scrolled', y > 60);
        if (mobBar) mobBar.classList.toggle('is-on', y > 480);
      };
      applyScrolled();
      window.addEventListener('scroll', applyScrolled, { passive: true });
    }

    /* Medición de clics a wa.me / calendar: NO se hace push aquí. GTM ya tiene
       triggers + tags `whatsapp_click` / `agendar_click` (publicados el 6 jul,
       ver _dev/PENDIENTES.md); un dataLayer.push 'cta_click' los duplicaría. */

    document.dispatchEvent(new CustomEvent('csComponentsReady'));
  }

  /* ── CSP-safe (sin inline handlers) ─────────────────────────────
     1) CSS async: los <link rel="preload" as="style" data-async> se
        promueven a stylesheet aquí (antes: onload= inline, bloqueado
        por CSP sin 'unsafe-inline').
     2) Fallbacks toggleNav/closeNav si la página no los define (home.js
        define los suyos; las internas usan estos).
     3) Delegación de clicks del navbar (antes: onclick= en los partials). */
  document.querySelectorAll('link[rel="preload"][as="style"][data-async]').forEach(function (l) {
    l.rel = 'stylesheet';
  });

  if (!window.toggleNav) window.toggleNav = function () {
    var m = document.getElementById('mobileNav');
    var h = document.getElementById('navHam');
    if (m) m.classList.toggle('open');
    if (h) h.classList.toggle('open');
  };
  if (!window.closeNav) window.closeNav = function () {
    var m = document.getElementById('mobileNav');
    var h = document.getElementById('navHam');
    if (m) m.classList.remove('open');
    if (h) h.classList.remove('open');
  };

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('#navHam, #langToggle, #mnav-lang, #mobileNav a') : null;
    if (!t) return;
    if (t.id === 'navHam') { window.toggleNav(); return; }
    if (t.id === 'langToggle') { if (window.toggleLang) window.toggleLang(); return; }
    if (t.id === 'mnav-lang') { if (window.toggleLang) window.toggleLang(); window.closeNav(); return; }
    window.closeNav(); /* links del mobileNav */
  });

  init();
})();
