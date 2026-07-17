// Medición de páginas de recursos (/recursos/<slug>/).
// Empuja eventos al dataLayer; los tags de GTM (Pixel/GA4) los recogen
// consent-gated — este archivo NO habla con Meta ni Google directamente.
//   recurso_view   → al abrir la página (GTM lo mapea a ViewContent / page_view)
//   descarga_guia  → al dar clic en Descargar (GTM lo mapea a DescargaGuia / file_download)
(function () {
  var main = document.querySelector('[data-recurso]');
  if (!main) return;
  var slug = main.getAttribute('data-recurso');

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'recurso_view', recurso: slug });

  // event_id para dedup con CAPI cuando el PDF se sirva desde el sitio
  function eventId() {
    return 'dg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
  }

  document.querySelectorAll('[data-descarga]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      window.dataLayer.push({ event: 'descarga_guia', recurso: slug, event_id: eventId() });
    });
  });
})();
