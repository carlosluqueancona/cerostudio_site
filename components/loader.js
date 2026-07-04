(function () {
  /* Fallback SIN SSR (el middleware inyecta los partials reales; esto solo corre
     si aquello falla). Detecta /en/ para no servir navbar/footer en español en
     las páginas en inglés. */
  var IS_EN = window.location.pathname.indexOf('/en/') === 0;

  var NAVBAR_ES = '<div id="mobileNav">' +
    '<a href="/#servicios" onclick="closeNav()" id="mnav-servicios">Servicios</a>' +
    '<a href="/#portafolio" onclick="closeNav()" id="mnav-portafolio">Portafolio</a>' +
    '<a href="/casos-de-exito/" onclick="closeNav()" id="mnav-casos">Casos de éxito</a>' +
    '<a href="/#nosotros" onclick="closeNav()" id="mnav-nosotros">Nosotros</a>' +
    '<a href="/#precios" onclick="closeNav()" id="mnav-precios">Precios</a>' +
    '<a href="/#contacto" onclick="closeNav()" id="mnav-contacto">Contacto</a>' +
    '<a href="/blog/" onclick="closeNav()" id="mnav-blog">Blog</a>' +
    '<button id="mnav-lang" class="lang-btn-mobile ht" onclick="toggleLang();closeNav();">EN</button>' +
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
    '<button id="langToggle" class="lang-btn ht" onclick="toggleLang()">EN</button>' +
    '<a href="https://calendar.app.google/Mk3sTdFWsaaaUNnj6" target="_blank" rel="noopener" class="nav-cta ht" id="nav-cta">Hablemos</a>' +
    '<div class="nav-ham ht" id="navHam" onclick="toggleNav()"><span></span><span></span><span></span></div>' +
    '</nav>';

  var NAVBAR_EN = '<div id="mobileNav">' +
    '<a href="/#servicios" onclick="closeNav()" id="mnav-servicios">Services</a>' +
    '<a href="/#portafolio" onclick="closeNav()" id="mnav-portafolio">Portfolio</a>' +
    '<a href="/en/about-us/" onclick="closeNav()" id="mnav-nosotros">About</a>' +
    '<a href="/#precios" onclick="closeNav()" id="mnav-precios">Pricing</a>' +
    '<a href="/#contacto" onclick="closeNav()" id="mnav-contacto">Contact</a>' +
    '<a href="/blog/" onclick="closeNav()" id="mnav-blog">Blog</a>' +
    '<button id="mnav-lang" class="lang-btn-mobile ht" onclick="toggleLang();closeNav();">ES</button>' +
    '</div>' +
    '<nav id="navbar">' +
    '<a href="/" class="ht"><img src="/images/svg/Cero_Studio_AI_Horizontal.svg" alt="Cero Studio" class="nav-logo"></a>' +
    '<ul class="nav-links">' +
    '<li><a href="/#servicios" class="ht" id="nav-servicios">Services</a></li>' +
    '<li><a href="/#portafolio" class="ht" id="nav-portafolio">Portfolio</a></li>' +
    '<li><a href="/en/case-studies/" class="ht" id="nav-casos">Cases</a></li>' +
    '<li><a href="/en/about-us/" class="ht" id="nav-nosotros">About</a></li>' +
    '<li><a href="/#precios" class="ht" id="nav-precios">Pricing</a></li>' +
    '<li><a href="/#contacto" class="ht" id="nav-contacto">Contact</a></li>' +
    '<li><a href="/blog/" class="ht" id="nav-blog">Blog</a></li>' +
    '</ul>' +
    '<button id="langToggle" class="lang-btn ht active-en" onclick="toggleLang()">ES</button>' +
    '<a href="https://calendar.app.google/Mk3sTdFWsaaaUNnj6" target="_blank" rel="noopener" class="nav-cta ht" id="nav-cta">Let\'s Talk</a>' +
    '<div class="nav-ham ht" id="navHam" onclick="toggleNav()"><span></span><span></span><span></span></div>' +
    '</nav>';

  var FOOTER_ES = '<footer>' +
    '<div class="footer-inner"><div class="footer-top">' +
    '<div><img src="/images/svg/Cero_Studio_AI.svg" alt="Cero Studio" class="footer-logo-img" width="1434" height="742">' +
    '<p class="footer-tagline" id="footer-tagline">Diseñamos el futuro digital de tu negocio.</p></div>' +
    '<div><p class="footer-col-title" id="fcol-nav-title">Navegación</p>' +
    '<ul class="footer-links" id="fcol-nav-links">' +
    '<li><a href="/#servicios" id="fnav-srv">Servicios</a></li>' +
    '<li><a href="/#portafolio" id="fnav-port">Portafolio</a></li>' +
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
    '</div></div></footer>';

  var FOOTER_EN = '<footer>' +
    '<div class="footer-inner"><div class="footer-top">' +
    '<div><img src="/images/svg/Cero_Studio_AI.svg" alt="Cero Studio" class="footer-logo-img" width="1434" height="742">' +
    '<p class="footer-tagline" id="footer-tagline">We design the digital future of your business.</p></div>' +
    '<div><p class="footer-col-title" id="fcol-nav-title">Navigation</p>' +
    '<ul class="footer-links" id="fcol-nav-links">' +
    '<li><a href="/#servicios" id="fnav-srv">Services</a></li>' +
    '<li><a href="/#portafolio" id="fnav-port">Portfolio</a></li>' +
    '<li><a href="/en/case-studies/" id="fnav-casos">Case Studies</a></li>' +
    '<li><a href="/en/about-us/" id="fnav-nos">About</a></li>' +
    '<li><a href="/#proceso" id="fnav-proc">Process</a></li>' +
    '<li><a href="/#contacto" id="fnav-contact">Contact</a></li>' +
    '<li><a href="/blog/" id="fnav-blog">Blog</a></li>' +
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
    '</div></div></footer>';

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

    /* On the homepage, convert /# links to # so navigation stays in-page */
    var isHome = window.location.pathname === '/' || window.location.pathname === '/index.html';
    if (isHome) {
      document.querySelectorAll('#navbar a[href^="/#"], #mobileNav a[href^="/#"]').forEach(function (a) {
        a.setAttribute('href', a.getAttribute('href').slice(1));
      });
    }

    /* Navbar scroll microanimation (transparent → blurred bg after 60px) */
    var navEl2 = document.getElementById('navbar');
    if (navEl2) {
      var applyScrolled = function () {
        navEl2.classList.toggle('scrolled', window.scrollY > 60);
      };
      applyScrolled();
      window.addEventListener('scroll', applyScrolled, { passive: true });
    }

    document.dispatchEvent(new CustomEvent('csComponentsReady'));
  }

  init();
})();
