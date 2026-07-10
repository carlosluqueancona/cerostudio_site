(function () {
  var KEY = 'cs_cookie_consent';
  var GTM_ID = 'GTM-PDS8GXPB';

  // ── Google Consent Mode v2 (2026-06-09) ────────────────────────────
  // Antes GTM solo se cargaba TRAS aceptar cookies → el verificador de
  // Google nunca acepta el banner y reportaba "Etiqueta GTM-PDS8GXPB no
  // se ha encontrado". Ahora GTM carga SIEMPRE pero con consentimiento
  // DENEGADO por default; aceptar el banner lo actualiza a granted.
  // Cumplimiento intacto: sin consentimiento, GA no setea cookies de
  // analytics ni ads (los tags respetan los flags de consent mode).
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500,
  });

  function loadGTM() {
    if (window._gtmLoaded) return;
    window._gtmLoaded = true;
    (function (w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      var f = d.getElementsByTagName(s)[0], j = d.createElement(s),
        dl = l !== 'dataLayer' ? '&l=' + l : '';
      j.async = true;
      j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', GTM_ID);
  }

  // ── Señales de Meta (fbc/fbp) ──────────────────────────────────────
  // Capturamos fbclid del landing y reconstruimos la cookie _fbc para
  // que el pixel/CAPI dedupliquen. persistFbcCookie() SOLO se escribe
  // tras consentimiento aceptado (se invoca desde grantConsent()).
  function getCookie(name) {
    try {
      var m = document.cookie.match('(?:^|; )' + name + '=([^;]*)');
      return m ? decodeURIComponent(m[1]) : '';
    } catch (e) { return ''; }
  }

  function buildFbc() {
    var c = getCookie('_fbc');
    if (c) return c;
    try {
      var raw = localStorage.getItem('cs_fbclid');
      if (raw) {
        var o = JSON.parse(raw);
        if (o && o.v) return 'fb.1.' + o.ts + '.' + o.v;
      }
    } catch (e) {}
    return '';
  }

  function persistFbcCookie() {
    try {
      if (getCookie('_fbc')) return;
      var v = buildFbc();
      if (!v) return;
      // domain=.cerostudio.ai solo aplica en producción; en previews (*.pages.dev)
      // el navegador rechaza la cookie por mismatch de dominio y la validación
      // end-to-end no reflejaría prod. Fuera de prod la escribimos host-only.
      var host = location.hostname;
      var onProd = host === 'cerostudio.ai' || host.slice(-14) === '.cerostudio.ai';
      var domainAttr = onProd ? '; domain=.cerostudio.ai' : '';
      document.cookie = '_fbc=' + v + '; path=/; max-age=7776000' + domainAttr + '; Secure; SameSite=Lax';
    } catch (e) {}
  }

  function grantConsent() {
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted',
    });
    window.dataLayer.push({ event: 'cs_consent_granted' });
    persistFbcCookie();
  }

  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function save(v)  { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function lang() {
    try {
      var stored = localStorage.getItem('cs-lang');
      if (stored) return stored;
      var nav = (navigator.language || navigator.userLanguage || 'es').toLowerCase();
      return nav.startsWith('en') ? 'en' : 'es';
    } catch (e) { return 'es'; }
  }

  var T = {
    es: {
      msg:    'Usamos cookies propias y de terceros (Google Analytics y Meta Pixel) para analizar el tráfico, medir campañas y mejorar tu experiencia.',
      link:   'Política de cookies',
      accept: 'Aceptar todo',
      reject: 'Solo esenciales',
    },
    en: {
      msg:    'We use first-party and third-party cookies (Google Analytics and Meta Pixel) to analyze traffic, measure campaigns and improve your experience.',
      link:   'Cookie policy',
      accept: 'Accept all',
      reject: 'Essential only',
    },
  };

  function removeBanner() {
    var el = document.getElementById('cs-cookie-bar');
    if (el) el.remove();
  }

  window._csAccept = function () {
    save('accepted');
    removeBanner();
    grantConsent();
    loadGTM();
  };

  window._csReject = function () {
    save('rejected');
    removeBanner();
    // GTM ya está cargado, pero el consent queda denied — los tags de
    // analytics/ads no setean cookies.
  };

  window._csShowBanner = showBanner;

  function showBanner() {
    if (document.getElementById('cs-cookie-bar')) return;
    var s = T[lang()] || T.es;
    var bar = document.createElement('div');
    bar.id = 'cs-cookie-bar';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', s.link);
    bar.style.cssText = [
      'position:fixed', 'bottom:0', 'left:0', 'right:0', 'z-index:99999',
      'background:#0d0d0d', 'border-top:1px solid #2a2a2a',
      'padding:14px 24px', 'display:flex', 'align-items:center',
      'justify-content:space-between', 'gap:16px', 'flex-wrap:wrap',
    ].join(';');
    bar.innerHTML =
      '<p id="cs-bar-msg" style="margin:0;font-size:13px;color:#bbb;max-width:680px;line-height:1.5;">' +
        s.msg + ' <a id="cs-bar-link" href="/privacidad/" style="color:#b2f700;text-decoration:underline;">' + s.link + '</a>' +
      '</p>' +
      '<div style="display:flex;gap:10px;flex-shrink:0;">' +
        '<button id="cs-bar-reject" onclick="window._csReject()" style="background:transparent;border:1px solid #444;color:#ccc;padding:8px 18px;font-size:13px;cursor:pointer;font-family:inherit;white-space:nowrap;">' + s.reject + '</button>' +
        '<button id="cs-bar-accept" onclick="window._csAccept()" style="background:#b2f700;border:none;color:#000;padding:8px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;">' + s.accept + '</button>' +
      '</div>';
    document.body.appendChild(bar);
  }

  // Captura de fbclid del landing (guardado siempre; NO setea cookie
  // hasta que haya consentimiento — eso lo hace persistFbcCookie()).
  try {
    var fbclid = new URLSearchParams(location.search).get('fbclid');
    if (fbclid) {
      localStorage.setItem('cs_fbclid', JSON.stringify({ v: fbclid, ts: Date.now() }));
    }
  } catch (e) {}

  // API pública para el pixel/GTM: consent actual + cookies de Meta.
  window.CS_META = {
    consent: function () { return stored(); },
    fbp: function () { return getCookie('_fbp'); },
    fbc: buildFbc,
  };

  var consent = stored();
  if (consent === 'accepted') {
    grantConsent();
  } else if (!consent) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
      showBanner();
    }
  }
  // GTM carga SIEMPRE (consent mode controla qué pueden hacer los tags).
  // 'rejected' → GTM cargado con consent denied, sin banner.
  loadGTM();
})();
