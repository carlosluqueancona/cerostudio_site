/* Form de /auditoria-gratis/ — externalizado por CSP (antes inline). */
    (function () {
      var form = document.getElementById('auditForm');
      if (!form) return;
      var btn = document.getElementById('auditBtn');
      var label = document.getElementById('auditBtnLabel');
      var feedback = document.getElementById('auditFeedback');

      function setFeedback(type, msg) {
        feedback.textContent = msg;
        feedback.className = 'form-feedback ' + type;
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (form.querySelector('[name="_gotcha"]').value) return;

        var nombre = form.nombre.value.trim();
        var email = form.email.value.trim();
        var sitio = form.sitio.value.trim();
        if (!nombre || !email || !sitio) { setFeedback('error', 'Completa los 3 campos para enviarte tu auditoría.'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFeedback('error', 'Revisa tu email — ahí te mandamos el reporte.'); return; }

        setFeedback('', '');
        btn.classList.add('loading');
        label.textContent = 'Enviando…';
        btn.disabled = true;

        var fd = new FormData(form);
        /* event_id para deduplicar Pixel (browser) vs CAPI (server) en Meta */
        var eventId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2);
        var payload = {
          nombre: nombre,
          email: email,
          empresa: sitio,
          servicio: 'auditoria-gratis',
          mensaje: 'Solicitud de auditoría exprés gratis.\nSitio a revisar: ' + sitio,
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
            label.textContent = 'Solicitar auditoría gratis';
            if (window.turnstile) window.turnstile.reset();
            if (res.ok) {
              window.dataLayer = window.dataLayer || [];
              window.dataLayer.push({ event: 'lead_form_submit', form_type: 'auditoria-gratis', event_id: eventId });
              setFeedback('success', 'Listo. Tu auditoría llega a tu email en máximo 48 horas hábiles.');
              form.reset();
            } else {
              return res.json().then(function (data) {
                setFeedback('error', (data && data.error) || 'Algo falló. Intenta de nuevo o escríbenos a hola@cerostudio.ai');
              }).catch(function () {
                setFeedback('error', 'Algo falló. Intenta de nuevo o escríbenos a hola@cerostudio.ai');
              });
            }
          })
          .catch(function () {
            btn.classList.remove('loading');
            btn.disabled = false;
            label.textContent = 'Solicitar auditoría gratis';
            setFeedback('error', 'Sin conexión. Intenta de nuevo o escríbenos a hola@cerostudio.ai');
          });
      });
    })();
  