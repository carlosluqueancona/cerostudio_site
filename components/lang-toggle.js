/**
 * Cero Studio · Lang Toggle (páginas internas sin i18n dynamic)
 *
 * El navbar tiene <button onclick="toggleLang()"> pero `toggleLang()` SOLO
 * existe en /js/home.js (home + futuras pages con i18n). En páginas internas
 * estáticas (servicios, mantenimiento, clínicas, blog) el navbar lo inyecta
 * el middleware → onclick falla silenciosamente → botón no hace nada.
 *
 * Este script define `toggleLang` SI no está definido todavía. Hace redirect
 * a la versión EN/ES equivalente según un mapa explícito. Si no hay equivalente
 * directo, redirige a `/` (ES) o `/en/` (EN).
 *
 * Carga: <script src="/components/lang-toggle.js" defer></script>
 * En home: NO cargar (home.js ya define la versión dynamic).
 */
(function () {
  if (typeof window === 'undefined') return;
  // No sobrescribir el toggleLang dynamic del home.
  if (typeof window.toggleLang === 'function') return;

  // Mapeo bidireccional de paths con versión multilingüe.
  // Añade entradas conforme creas nuevas páginas en /en/.
  var ES_TO_EN = {
    '/':                                '/en/',
    '/nosotros/':                       '/en/about-us/',
    '/servicios/desarrollo-web/':       '/en/services/web-development/',
    '/servicios/tiendas-ecommerce/':    '/en/services/online-stores/',
    '/servicios/seo/':                  '/en/services/seo/',
    '/servicios/branding-digital/':     '/en/services/digital-branding/',
    '/servicios/consultoria-digital/':  '/en/services/digital-consulting/',
  };
  // Invertir el mapa para EN → ES.
  var EN_TO_ES = {};
  Object.keys(ES_TO_EN).forEach(function (k) { EN_TO_ES[ES_TO_EN[k]] = k; });

  function isEnglish(pathname) {
    return pathname === '/en' || pathname === '/en/' || pathname.indexOf('/en/') === 0;
  }

  function normalize(pathname) {
    // Asegurar trailing slash para uniformidad.
    if (!pathname) return '/';
    if (pathname.length > 1 && pathname.slice(-1) !== '/') pathname += '/';
    return pathname;
  }

  window.toggleLang = function () {
    var p = normalize(window.location.pathname);
    var target;
    if (isEnglish(p)) {
      target = EN_TO_ES[p] || '/';
    } else {
      target = ES_TO_EN[p] || '/en/';
    }
    // Persist preferencia para que el home + futuras pages respeten elección.
    try { localStorage.setItem('cs-lang', isEnglish(p) ? 'es' : 'en'); } catch (e) { }
    window.location.href = target;
  };

  // Cerrar el hamburger menu si lo abre el usuario antes del toggle (mobile).
  // closeNav() puede no existir en estas páginas — wrap en try.
  if (typeof window.closeNav !== 'function') {
    window.closeNav = function () { /* no-op */ };
  }
})();
