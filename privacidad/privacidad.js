/* Lógica de /privacidad/ — externalizada por CSP (antes inline).
   Los botones usan data-privlang / data-consent en vez de onclick. */
(function () {
  var CS_KEY = 'cs_cookie_consent';

  function saveConsent(v) {
    try { localStorage.setItem(CS_KEY, v); } catch(e) {}
  }

  function acceptCookies() {
    saveConsent('accepted');
    updateConsentStatus();
    // Load GTM if not already loaded
    if (!window._gtmLoaded) {
      window._gtmLoaded = true;
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-PDS8GXPB';
      document.head.appendChild(s);
    }
    // Remove the cookie bar if visible
    var bar = document.getElementById('cs-cookie-bar');
    if (bar) bar.remove();
  }

  function rejectCookies() {
    saveConsent('rejected');
    updateConsentStatus();
    var bar = document.getElementById('cs-cookie-bar');
    if (bar) bar.remove();
  }

  function resetConsent() {
    try { localStorage.removeItem(CS_KEY); } catch(e) {}
    // Redirect to homepage — banner will appear there naturally
    window.location.href = '/';
  }

  function updateConsentStatus() {
    var v;
    try { v = localStorage.getItem(CS_KEY); } catch(e) {}
    var esEl = document.getElementById('consent-status');
    var enEl = document.getElementById('consent-status-en');
    var label, cls;
    if (v === 'accepted')      { label = { es: 'Aceptado',         en: 'Accepted'        }; cls = 'accepted'; }
    else if (v === 'rejected') { label = { es: 'Solo esenciales',  en: 'Essential only'  }; cls = 'rejected'; }
    else                       { label = { es: 'Sin decisión',     en: 'No decision yet' }; cls = 'pending';  }
    if (esEl) esEl.innerHTML = 'Preferencia actual: <span class="' + cls + '">' + label.es + '</span>';
    if (enEl) enEl.innerHTML = 'Current preference: <span class="' + cls + '">' + label.en + '</span>';
  }

  function privLang(l) {
    document.getElementById('sec-es').classList.toggle('active', l === 'es');
    document.getElementById('sec-en').classList.toggle('active', l === 'en');
    document.getElementById('btn-es').classList.toggle('active', l === 'es');
    document.getElementById('btn-en').classList.toggle('active', l === 'en');
  }

  updateConsentStatus();

  try {
    var urlLang = new URLSearchParams(window.location.search).get('lang');
    var storedLang = localStorage.getItem('cs-lang');
    if ((urlLang || storedLang) === 'en') privLang('en');
  } catch(e) {}

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-privlang], [data-consent]') : null;
    if (!t) return;
    var lang = t.getAttribute('data-privlang');
    if (lang) { privLang(lang); return; }
    var action = t.getAttribute('data-consent');
    if (action === 'accept') acceptCookies();
    else if (action === 'reject') rejectCookies();
    else if (action === 'reset') resetConsent();
  });
})();
