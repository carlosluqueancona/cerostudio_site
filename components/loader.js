(function () {
  var NAVBAR_HTML = '<div id="mobileNav">' +
    '<a href="/#servicios" onclick="closeNav()" id="mnav-servicios">Servicios</a>' +
    '<a href="/#portafolio" onclick="closeNav()" id="mnav-portafolio">Portafolio</a>' +
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
    '<li><a href="/#nosotros" class="ht" id="nav-nosotros">Nosotros</a></li>' +
    '<li><a href="/#precios" class="ht" id="nav-precios">Precios</a></li>' +
    '<li><a href="/#contacto" class="ht" id="nav-contacto">Contacto</a></li>' +
    '<li><a href="/blog/" class="ht" id="nav-blog">Blog</a></li>' +
    '</ul>' +
    '<button id="langToggle" class="lang-btn ht" onclick="toggleLang()">EN</button>' +
    '<a href="/#contacto" class="nav-cta ht" id="nav-cta">Hablemos</a>' +
    '<div class="nav-ham ht" id="navHam" onclick="toggleNav()"><span></span><span></span><span></span></div>' +
    '</nav>';

  var FOOTER_HTML = '<footer>' +
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
    '<li><a href="/#servicios" id="fsrv-1">Desarrollo Web</a></li>' +
    '<li><a href="/#servicios" id="fsrv-2">Tiendas eCommerce</a></li>' +
    '<li><a href="/#servicios" id="fsrv-3">Branding Digital</a></li>' +
    '<li><a href="/#servicios" id="fsrv-4">SEO &amp; Visibilidad</a></li>' +
    '<li><a href="/#servicios" id="fsrv-5">Mantenimiento</a></li>' +
    '</ul></div>' +
    '<div><p class="footer-col-title" id="fcol-contact-title">Contacto</p>' +
    '<ul class="footer-links">' +
    '<li><a href="mailto:hola@cerostudio.ai">hola@cerostudio.ai</a></li>' +
    '<li><a href="https://instagram.com/cerostudio.ai" target="_blank" rel="noopener">Instagram</a></li>' +
    '<li><a href="https://linkedin.com/company/cerostudio" target="_blank" rel="noopener">LinkedIn</a></li>' +
    '</ul></div>' +
    '</div>' +
    '<div class="footer-bottom">' +
    '<p class="footer-copy" id="footer-copy">\u00a9 2026 Cero Studio. Todos los derechos reservados.</p>' +
    '<p class="footer-credit" id="footer-credit">Hecho con <span>\u2665</span> para emprendedores</p>' +
    '</div></div></footer>';

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

    inject(navEl, NAVBAR_HTML);
    inject(ftEl,  FOOTER_HTML);

    /* On the homepage, convert /# links to # so navigation stays in-page */
    var isHome = window.location.pathname === '/' || window.location.pathname === '/index.html';
    if (isHome) {
      document.querySelectorAll('#navbar a[href^="/#"], #mobileNav a[href^="/#"]').forEach(function (a) {
        a.setAttribute('href', a.getAttribute('href').slice(1));
      });
    }

    document.dispatchEvent(new CustomEvent('csComponentsReady'));
  }

  init();
})();
