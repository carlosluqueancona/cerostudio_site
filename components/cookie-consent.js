(function () {
  var KEY = 'cs_cookie_consent';
  var GTM_ID = 'GTM-PDS8GXPB';

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

  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function save(v)  { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function lang()   { try { return localStorage.getItem('cs_lang') || 'es'; } catch (e) { return 'es'; } }

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
    loadGTM();
  };

  window._csReject = function () {
    save('rejected');
    removeBanner();
  };

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
      '<p style="margin:0;font-size:13px;color:#bbb;max-width:680px;line-height:1.5;">' +
        s.msg + ' <a href="/privacidad/" style="color:#ceff33;text-decoration:underline;">' + s.link + '</a>' +
      '</p>' +
      '<div style="display:flex;gap:10px;flex-shrink:0;">' +
        '<button onclick="window._csReject()" style="background:transparent;border:1px solid #444;color:#ccc;padding:8px 18px;font-size:13px;cursor:pointer;font-family:inherit;white-space:nowrap;">' + s.reject + '</button>' +
        '<button onclick="window._csAccept()" style="background:#ceff33;border:none;color:#000;padding:8px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;">' + s.accept + '</button>' +
      '</div>';
    document.body.appendChild(bar);
  }

  var consent = stored();
  if (consent === 'accepted') {
    loadGTM();
  } else if (!consent) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
      showBanner();
    }
  }
  // 'rejected' → no GTM, no banner
})();
