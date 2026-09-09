/* Form de /auditoria-gratis/ — externalizado por CSP (antes inline).
   Bifurcación "¿Ya tienes sitio web?": con sitio → URL (validación suave de
   dominio); sin sitio → nombre y dirección del negocio (insumo del diagnóstico
   de presencia local en Google/Maps/redes). */
    (function () {
      var form = document.getElementById('auditForm');
      if (!form) return;
      var btn = document.getElementById('auditBtn');
      var label = document.getElementById('auditBtnLabel');
      var feedback = document.getElementById('auditFeedback');
      var grpSitio = document.getElementById('grp-sitio');
      var grpNegocio = document.getElementById('grp-negocio');
      var promesa = document.getElementById('a-promesa');

      var PROMESAS = {
        si: 'Auditamos velocidad, SEO y conversión de tu sitio — 5 hallazgos accionables.',
        no: 'Sin sitio también hay diagnóstico: revisamos tu presencia digital (Google, Maps, redes) y te decimos qué necesitas para arrancar.'
      };

      function tieneSitio() {
        var r = form.querySelector('[name="tiene_sitio"]:checked');
        return r ? r.value : 'si';
      }

      function syncToggle() {
        var conSitio = tieneSitio() === 'si';
        grpSitio.hidden = !conSitio;
        grpNegocio.hidden = conSitio;
        if (promesa) promesa.textContent = conSitio ? PROMESAS.si : PROMESAS.no;
      }

      var radios = form.querySelectorAll('[name="tiene_sitio"]');
      for (var i = 0; i < radios.length; i++) radios[i].addEventListener('change', syncToggle);
      syncToggle();

      /* Validación suave: parece dominio si tiene un punto con TLD de 2+ letras
         y no trae espacios (se tolera protocolo y rutas). No bloquea nada más. */
      function pareceDominio(v) {
        var limpio = v.replace(/^https?:\/\//i, '').trim();
        return limpio.indexOf(' ') === -1 && /\.[a-zA-Z]{2,}/.test(limpio);
      }

      /* Solo el estado success lleva HTML (string propia, sin datos del
         usuario): enlaza la guía gratis como siguiente paso. Todo lo demás
         (errores del servidor incluidos) va por textContent. */
      var SUCCESS_HTML = 'Listo. Tu auditoría llega a tu email en máximo 48 horas hábiles. Mientras tanto, <a href="/recursos/5-errores-web/">descarga la guía de los 5 errores</a> — tres los arreglas tú esta semana.';

      function setFeedback(type, msg) {
        if (type === 'success') feedback.innerHTML = SUCCESS_HTML;
        else feedback.textContent = msg;
        feedback.className = 'form-feedback ' + type;
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (form.querySelector('[name="_gotcha"]').value) return;

        var nombre = form.nombre.value.trim();
        var email = form.email.value.trim();
        var conSitio = tieneSitio() === 'si';
        var sitio = conSitio ? form.sitio.value.trim() : form.negocio.value.trim();
        /* Solo dígitos; acepta "55 1234 5678", "+52 1 55...", etc. */
        var whatsapp = form.whatsapp.value.replace(/\D/g, '');
        if (whatsapp.length === 12 && whatsapp.indexOf('52') === 0) whatsapp = whatsapp.slice(2);
        if (whatsapp.length === 13 && whatsapp.indexOf('521') === 0) whatsapp = whatsapp.slice(3);
        if (!nombre || !email || !form.whatsapp.value.trim() || !sitio) { setFeedback('error', 'Completa los 4 datos para enviarte tu auditoría.'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFeedback('error', 'Revisa tu email — ahí te mandamos el reporte.'); return; }
        if (whatsapp.length !== 10) { setFeedback('error', 'Revisa tu WhatsApp — deben ser 10 dígitos (ej. 55 1234 5678).'); return; }
        if (conSitio && !pareceDominio(sitio)) { setFeedback('error', 'Eso no parece un link — escribe algo como minegocio.mx. ¿Todavía no tienes sitio? Marca "Todavía no" y te diagnosticamos igual.'); return; }

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
          tiene_sitio: conSitio ? 'si' : 'no',
          sitio: sitio,
          mensaje: conSitio
            ? 'Solicitud de auditoría exprés gratis.\nSitio a revisar: ' + sitio
            : 'Solicitud de auditoría exprés gratis (SIN SITIO WEB → diagnóstico de presencia local).\nNegocio: ' + sitio,
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
            label.textContent = 'Solicitar auditoría gratis';
            if (window.turnstile) window.turnstile.reset();
            if (res.ok) {
              window.dataLayer = window.dataLayer || [];
              window.dataLayer.push({ event: 'lead_form_submit', form_type: 'auditoria-gratis', segmento_sitio: conSitio ? 'con-sitio' : 'sin-sitio', event_id: eventId });
              setFeedback('success');
              form.reset();
              syncToggle();
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
