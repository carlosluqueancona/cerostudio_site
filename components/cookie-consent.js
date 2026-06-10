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

  function grantConsent() {
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted',
    });
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
      msg:    'Usamos cookies propias y de terceros (Google Analytics) para analizar el tráfico y mejorar tu experiencia.',
      link:   'Política de cookies',
      accept: 'Aceptar todo',
      reject: 'Solo esenciales',
    },
    en: {
      msg:    'We use first-party and third-party cookies (Google Analytics) to analyze traffic and improve your experience.',
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
