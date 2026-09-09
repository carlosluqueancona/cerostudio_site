/* Form de /ventas/ y /en/sales/ — captura de leads del Sistema de clientes.
   Compartido bilingüe (LANG por documentElement.lang, mismo patrón de js/ia.js).
   Los CTAs de precios llevan data-plan-name; al hacer click actualizan el plan
   que viaja en el mensaje prellenado hacia /api/contact (servicio=consultoria,
   mismo contrato de payload que js/audit-form.js). */
(function () {
  'use strict';

  var LANG = (document.documentElement.lang || 'es').indexOf('en') === 0 ? 'en' : 'es';

  var T = {
    es: {
      defaultPlan: 'Sistema Esencial',
      msgTpl: function (plan, negocio) { return 'Me interesa el Sistema de clientes (' + plan + '). Mi negocio: ' + negocio; },
      fill: 'Completa los 4 datos para que armemos tu propuesta.',
      email: 'Revisa tu email — ahí te contactamos.',
      wa: 'Revisa tu WhatsApp — deben ser 10 dígitos (ej. 55 1234 5678).',
      label: 'Quiero el sistema',
      sending: 'Enviando…',
      ok: 'Listo. En menos de 24 horas te escribimos por WhatsApp con tu propuesta y la fecha de instalación.',
      err: 'Algo falló. Intenta de nuevo o escríbenos a hola@cerostudio.ai',
      offline: 'Sin conexión. Intenta de nuevo o escríbenos a hola@cerostudio.ai'
    },
    en: {
      defaultPlan: 'Essential System',
      msgTpl: function (plan, negocio) { return "I'm interested in the Client System (" + plan + '). My business: ' + negocio; },
      fill: 'Fill in all 4 fields so we can put together your proposal.',
      email: "Check your email — that's how we'll reach you.",
      wa: 'Check your WhatsApp — it must be 10 digits (e.g. 55 1234 5678).',
      label: 'I want this system',
      sending: 'Sending…',
      ok: "Done. Within 24 hours we'll message you on WhatsApp with your proposal and installation date.",
      err: 'Something failed. Try again or email us at hola@cerostudio.ai',
      offline: 'No connection. Try again or email us at hola@cerostudio.ai'
    }
  }[LANG];

  /* ── Selección de plan desde los CTAs de precios/hero/orden final ─── */
  var planInput = document.getElementById('v-plan');
  var planLabel = document.getElementById('v-plan-label');
  function setPlan(name) {
    if (!name) return;
    if (planInput) planInput.value = name;
    if (planLabel) planLabel.textContent = name;
  }
  var planCtas = document.querySelectorAll('[data-plan-name]');
  for (var i = 0; i < planCtas.length; i++) {
    planCtas[i].addEventListener('click', (function (el) {
      return function () { setPlan(el.getAttribute('data-plan-name')); };
    })(planCtas[i]));
  }

  /* ── Formulario de contacto ────────────────────────────────────────── */
  var form = document.getElementById('ventasForm');
  if (!form) return;
  var btn = document.getElementById('ventasBtn');
  var label = document.getElementById('ventasBtnLabel');
  var feedback = document.getElementById('ventasFeedback');

  function setFeedback(type, msg) {
    feedback.textContent = msg || '';
    feedback.className = 'form-feedback ' + type;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.querySelector('[name="_gotcha"]').value) return;

    var nombre = form.nombre.value.trim();
    var email = form.email.value.trim();
    var negocio = form.negocio.value.trim();
    /* Solo dígitos; acepta "55 1234 5678", "+52 1 55...", etc. */
    var whatsapp = form.whatsapp.value.replace(/\D/g, '');
    if (whatsapp.length === 12 && whatsapp.indexOf('52') === 0) whatsapp = whatsapp.slice(2);
    if (whatsapp.length === 13 && whatsapp.indexOf('521') === 0) whatsapp = whatsapp.slice(3);
    if (!nombre || !email || !negocio || !form.whatsapp.value.trim()) { setFeedback('error', T.fill); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFeedback('error', T.email); return; }
    if (whatsapp.length !== 10) { setFeedback('error', T.wa); return; }

    setFeedback('', '');
    btn.classList.add('loading');
    label.textContent = T.sending;
    btn.disabled = true;

    var plan = (planInput && planInput.value) || T.defaultPlan;
    var fd = new FormData(form);
    /* event_id para deduplicar Pixel (browser) vs CAPI (server) en Meta */
    var eventId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2);
    var payload = {
      nombre: nombre,
      email: email,
      empresa: negocio,
      servicio: 'consultoria',
      mensaje: T.msgTpl(plan, negocio),
      whatsapp: whatsapp,
      cf_turnstile_response: fd.get('cf-turnstile-response') || '',
      event_id: eventId,
      page_url: location.href
    };
    if (window.CS_META) { payload.consent = window.CS_META.consent() || ''; payload.fbp = window.CS_META.fbp(); payload.fbc = window.CS_META.fbc(); }

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        btn.classList.remove('loading');
        btn.disabled = false;
        label.textContent = T.label;
        if (window.turnstile) window.turnstile.reset();
        if (res.ok) {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({ event: 'lead_form_submit', form_type: 'ventas', plan: plan, event_id: eventId });
          setFeedback('success', T.ok);
          form.reset();
          setPlan(T.defaultPlan);
        } else {
          return res.json().then(function (data) {
            setFeedback('error', (data && data.error) || T.err);
          }).catch(function () {
            setFeedback('error', T.err);
          });
        }
      })
      .catch(function () {
        btn.classList.remove('loading');
        btn.disabled = false;
        label.textContent = T.label;
        setFeedback('error', T.offline);
      });
  });
})();
