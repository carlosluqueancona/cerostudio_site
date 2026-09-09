/* Simulador de AI Search (/ia/, /en/ai/) + demo estática en la ficha SEO.
   Externalizado por CSP (sin inline). Dos modos:
   - Simulador: #iaForm → POST /api/ia → respuesta "escrita" en la ventana de
     chat + veredicto + hallazgos; #iaLeadForm → /api/contact (mismo contrato
     de payload que js/audit-form.js, servicio=auditoria-gratis).
   - Demo: cada .ia-chat[data-ia-demo] teclea sus mensajes de IA al entrar en
     viewport (antes/después con negocios ficticios). */
(function () {
  'use strict';

  var LANG = (document.documentElement.lang || 'es').indexOf('en') === 0 ? 'en' : 'es';
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var T = {
    es: {
      q: function (giro, ciudad) { return 'Recomiéndame un ' + giro + ' en ' + ciudad + '. Dame 3 opciones con una línea cada una.'; },
      fill: 'Completa los tres datos: nombre del negocio, giro y ciudad.',
      long: 'Cada dato debe tener entre 2 y 80 caracteres, sin símbolos < o >.',
      bot: 'Espera un segundo a que termine la verificación anti-bot y vuelve a intentar.',
      askLabel: 'Preguntarle a la IA →',
      asking: 'Preguntando…',
      offline: 'Sin conexión. Intenta de nuevo o escríbenos a hola@cerostudio.ai',
      failed: 'Algo falló al consultar a la IA. Intenta de nuevo.',
      hitH: '¡La IA sí te mencionó!',
      hitP: 'Aun así, revisa cómo lo hizo: ¿te describió con los datos correctos, con tu especialidad y tu zona? Una mención vaga hoy se cae mañana. El reporte completo te dice qué la sostiene.',
      missH: 'La IA no te nombró. Recomendó a otros.',
      missP: 'No es que tu negocio sea peor: es que la IA no tiene cómo entenderlo. Esto es lo que le falta a tu sitio para que te recomiende a ti:',
      leadFill: 'Completa nombre, email y WhatsApp para enviarte tu reporte.',
      leadEmail: 'Revisa tu email — ahí te mandamos el reporte.',
      leadWa: 'Revisa tu WhatsApp — deben ser 10 dígitos (ej. 55 1234 5678).',
      leadSite: 'Eso no parece un link — escribe algo como minegocio.mx, o déjalo vacío si aún no tienes sitio.',
      leadLabel: 'Quiero mi reporte gratis',
      sending: 'Enviando…',
      leadOk: 'Listo. Tu reporte llega a tu email en máximo 48 horas hábiles. Mientras tanto, <a href="/recursos/5-errores-web/">descarga la guía de los 5 errores</a> — tres los arreglas tú esta semana.',
      leadErr: 'Algo falló. Intenta de nuevo o escríbenos a hola@cerostudio.ai',
      yes: 'sí', no: 'no', none: 'sin simulación'
    },
    en: {
      q: function (giro, ciudad) { return 'Recommend a ' + giro + ' in ' + ciudad + '. Give me 3 options with one line each.'; },
      fill: 'Fill in all three fields: business name, category and city.',
      long: 'Each field must be 2 to 80 characters, with no < or > symbols.',
      bot: 'Give the anti-bot check a second to finish, then try again.',
      askLabel: 'Ask the AI →',
      asking: 'Asking…',
      offline: 'No connection. Try again or email us at hola@cerostudio.ai',
      failed: 'Something failed while asking the AI. Try again.',
      hitH: 'The AI did mention you!',
      hitP: 'Still, look at how it did it: did it get your details, your specialty and your area right? A vague mention today is gone tomorrow. The full report tells you what keeps it there.',
      missH: 'The AI didn\'t name you. It recommended others.',
      missP: 'It\'s not that your business is worse: the AI simply has no way to understand it. This is what your site is missing for the AI to recommend you:',
      leadFill: 'Fill in your name, email and WhatsApp so we can send your report.',
      leadEmail: 'Check your email — that\'s where the report goes.',
      leadWa: 'Check your WhatsApp — it must be 10 digits (e.g. 55 1234 5678).',
      leadSite: 'That doesn\'t look like a link — type something like mybusiness.com, or leave it empty if you have no site yet.',
      leadLabel: 'Send me my free report',
      sending: 'Sending…',
      leadOk: 'Done. Your report reaches your inbox within 48 business hours. Meanwhile, <a href="/en/">see how we build sites that sell</a>.',
      leadErr: 'Something failed. Try again or email us at hola@cerostudio.ai',
      yes: 'yes', no: 'no', none: 'no simulation'
    }
  }[LANG];

  /* ── Utilidades ──────────────────────────────────────────────────── */
  function normChar(c) {
    return c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  /* Resalta el nombre del negocio dentro del texto ya tecleado (sin acentos,
     sin mayúsculas). Construye nodos DOM, nunca innerHTML con datos del usuario. */
  function highlight(el, text, name) {
    var map = [], normed = '';
    for (var i = 0; i < text.length; i++) {
      var n = normChar(text[i]);
      for (var j = 0; j < n.length; j++) { normed += n[j]; map.push(i); }
    }
    var target = '';
    for (var k = 0; k < name.length; k++) target += normChar(name[k]);
    target = target.replace(/\s+/g, ' ').trim();
    if (!target) return;
    var frag = document.createDocumentFragment(), pos = 0, from = 0, idx;
    while ((idx = normed.indexOf(target, from)) !== -1) {
      var start = map[idx], end = map[idx + target.length - 1] + 1;
      frag.appendChild(document.createTextNode(text.slice(pos, start)));
      var m = document.createElement('mark');
      m.textContent = text.slice(start, end);
      frag.appendChild(m);
      pos = end;
      from = idx + target.length;
    }
    frag.appendChild(document.createTextNode(text.slice(pos)));
    el.textContent = '';
    el.appendChild(frag);
  }

  /* Efecto máquina de escribir. Devuelve una Promise que resuelve al terminar.
     Con prefers-reduced-motion pinta el texto completo de inmediato. */
  function typeText(el, text, speed) {
    speed = speed || 14;
    el.textContent = '';
    var cursor = document.createElement('span');
    cursor.className = 'ia-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    el.appendChild(cursor);
    if (REDUCED) {
      el.insertBefore(document.createTextNode(text), cursor);
      cursor.className += ' is-done';
      return Promise.resolve();
    }
    var node = document.createTextNode('');
    el.insertBefore(node, cursor);
    return new Promise(function (resolve) {
      var i = 0;
      (function tick() {
        if (i >= text.length) { cursor.className += ' is-done'; resolve(); return; }
        var step = text.length > 400 ? 3 : (text.length > 200 ? 2 : 1);
        node.data += text.substr(i, step);
        i += step;
        var ch = text[i - 1];
        var pause = (ch === '.' || ch === '\n') ? speed * 12 : (ch === ',' ? speed * 4 : speed);
        setTimeout(tick, pause);
      })();
    });
  }

  function thinking(el) {
    el.textContent = '';
    var w = document.createElement('span');
    w.className = 'ia-thinking';
    w.setAttribute('aria-label', LANG === 'en' ? 'Thinking' : 'Pensando');
    for (var i = 0; i < 3; i++) w.appendChild(document.createElement('i'));
    el.appendChild(w);
  }

  function pareceDominio(v) {
    var limpio = v.replace(/^https?:\/\//i, '').trim();
    return limpio.indexOf(' ') === -1 && /\.[a-zA-Z]{2,}/.test(limpio);
  }

  function pushDL(obj) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(obj);
  }

  function turnstileToken(form) {
    var inp = form.querySelector('[name="cf-turnstile-response"]');
    return inp ? inp.value : '';
  }
  function resetTurnstile(form) {
    var w = form.querySelector('.cf-turnstile');
    if (window.turnstile && w) { try { window.turnstile.reset(w); } catch (e) { /* widget aún no montado */ } }
  }

  /* ── Modo demo (ficha SEO): teclea al entrar en viewport ─────────── */
  function initDemo() {
    var chats = document.querySelectorAll('.ia-chat[data-ia-demo]');
    if (!chats.length) return;
    function play(chat) {
      if (chat.getAttribute('data-ia-played')) return;
      chat.setAttribute('data-ia-played', '1');
      chat.classList.add('is-on');
      var msgs = chat.querySelectorAll('.ia-msg.is-ai .txt');
      var name = chat.getAttribute('data-ia-name') || '';
      var i = 0;
      (function next() {
        if (i >= msgs.length) return;
        var el = msgs[i++];
        var text = el.getAttribute('data-ia-text') || '';
        typeText(el, text, 10).then(function () {
          if (name) highlight(el, text, name);
          next();
        });
      })();
    }
    /* El texto vive en el HTML (legible sin JS). Se normaliza la indentación
       del código fuente (.txt es pre-wrap) y, si vamos a animar, se vacía. */
    var animate = !REDUCED && !!window.IntersectionObserver;
    for (var j = 0; j < chats.length; j++) {
      var txts = chats[j].querySelectorAll('.ia-msg .txt');
      for (var k = 0; k < txts.length; k++) {
        var clean = txts[k].textContent.replace(/[ \t]*\n[ \t]*/g, '\n').trim();
        txts[k].setAttribute('data-ia-text', clean);
        txts[k].textContent = (animate && txts[k].parentNode.classList.contains('is-ai')) ? '' : clean;
      }
      if (!animate) chats[j].classList.add('is-on');
    }
    if (!animate) return;
    var io = new IntersectionObserver(function (entries) {
      for (var e = 0; e < entries.length; e++) {
        if (entries[e].isIntersecting) { play(entries[e].target); io.unobserve(entries[e].target); }
      }
    }, { threshold: 0.35 });
    for (var c = 0; c < chats.length; c++) io.observe(chats[c]);
  }

  /* ── Modo simulador (/ia/) ───────────────────────────────────────── */
  var sim = { negocio: '', giro: '', ciudad: '', mentioned: null };

  function initSimulator() {
    var form = document.getElementById('iaForm');
    if (!form) return;
    var btn = document.getElementById('iaBtn');
    var label = document.getElementById('iaBtnLabel');
    var errBox = document.getElementById('iaError');
    var result = document.getElementById('iaResult');
    var chat = result.querySelector('.ia-chat');
    var userTxt = document.getElementById('iaUserTxt');
    var aiTxt = document.getElementById('iaAnswer');
    var verdict = document.getElementById('iaVerdict');
    var verdictH = verdict.querySelector('h3');
    var verdictP = verdict.querySelector('p');
    var findings = document.getElementById('iaFindings');
    var modelTag = document.getElementById('iaModel');

    function setError(msg) {
      errBox.textContent = msg || '';
      errBox.hidden = !msg;
    }
    function setBusy(on) {
      btn.disabled = on;
      btn.classList.toggle('loading', on);
      label.textContent = on ? T.asking : T.askLabel;
    }
    function clean(v) { return (v || '').replace(/\s+/g, ' ').trim(); }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.querySelector('[name="_gotcha"]').value) return;
      var negocio = clean(form.negocio.value), giro = clean(form.giro.value), ciudad = clean(form.ciudad.value);
      if (!negocio || !giro || !ciudad) { setError(T.fill); return; }
      var vals = [negocio, giro, ciudad];
      for (var i = 0; i < 3; i++) {
        if (vals[i].length < 2 || vals[i].length > 80 || /[<>]/.test(vals[i])) { setError(T.long); return; }
      }
      var token = turnstileToken(form);
      if (window.turnstile && !token) { setError(T.bot); return; }

      setError('');
      setBusy(true);
      sim.negocio = negocio; sim.giro = giro; sim.ciudad = ciudad; sim.mentioned = null;

      /* Ventana de chat: pregunta del usuario + IA "pensando" */
      result.hidden = false;
      verdict.hidden = true;
      findings.hidden = true;
      chat.classList.add('is-on');
      userTxt.textContent = T.q(giro, ciudad);
      thinking(aiTxt);
      if (window.scrollTo) {
        var top = result.getBoundingClientRect().top + window.pageYOffset - 90;
        window.scrollTo({ top: top, behavior: REDUCED ? 'auto' : 'smooth' });
      }

      fetch('/api/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ negocio: negocio, giro: giro, ciudad: ciudad, lang: LANG, turnstile: token })
      })
        .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (r) {
          setBusy(false);
          resetTurnstile(form);
          if (!r.ok || !r.data || !r.data.ok) {
            aiTxt.textContent = '';
            result.hidden = true;
            setError((r.data && r.data.error) || T.failed);
            return;
          }
          var d = r.data;
          sim.mentioned = !!d.mentioned;
          if (modelTag && d.model) modelTag.textContent = d.model;
          pushDL({ event: 'ia_simulacion', mentioned: sim.mentioned, giro: giro, ciudad: ciudad });
          return typeText(aiTxt, d.answer).then(function () {
            if (sim.mentioned) highlight(aiTxt, d.answer, negocio);
            verdict.className = 'ia-verdict ' + (sim.mentioned ? 'is-hit' : 'is-miss');
            verdictH.textContent = sim.mentioned ? T.hitH : T.missH;
            verdictP.textContent = sim.mentioned ? T.hitP : T.missP;
            verdict.hidden = false;
            if (!sim.mentioned && d.findings && d.findings.length) {
              findings.textContent = '';
              for (var f = 0; f < d.findings.length; f++) {
                var li = document.createElement('li');
                li.textContent = d.findings[f];
                findings.appendChild(li);
              }
              findings.hidden = false;
            }
          });
        })
        .catch(function () {
          setBusy(false);
          resetTurnstile(form);
          aiTxt.textContent = '';
          result.hidden = true;
          setError(T.offline);
        });
    });
  }

  /* ── Captura del lead → /api/contact (contrato de js/audit-form.js) ── */
  function initLead() {
    var form = document.getElementById('iaLeadForm');
    if (!form) return;
    var btn = document.getElementById('iaLeadBtn');
    var label = document.getElementById('iaLeadBtnLabel');
    var feedback = document.getElementById('iaLeadFeedback');

    function setFeedback(type, msg) {
      if (type === 'success') feedback.innerHTML = T.leadOk; /* string propia, sin datos del usuario */
      else feedback.textContent = msg;
      feedback.className = 'form-feedback ' + type;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.querySelector('[name="_gotcha"]').value) return;

      var nombre = form.nombre.value.trim();
      var email = form.email.value.trim();
      var sitio = form.sitio.value.trim();
      var whatsapp = form.whatsapp.value.replace(/\D/g, '');
      if (whatsapp.length === 12 && whatsapp.indexOf('52') === 0) whatsapp = whatsapp.slice(2);
      if (whatsapp.length === 13 && whatsapp.indexOf('521') === 0) whatsapp = whatsapp.slice(3);
      if (!nombre || !email || !form.whatsapp.value.trim()) { setFeedback('error', T.leadFill); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFeedback('error', T.leadEmail); return; }
      if (whatsapp.length !== 10) { setFeedback('error', T.leadWa); return; }
      if (sitio && !pareceDominio(sitio)) { setFeedback('error', T.leadSite); return; }

      var conSitio = !!sitio;
      var negocioRef = sim.negocio ? (sim.negocio + ' · ' + sim.giro + ' · ' + sim.ciudad) : '';
      var simLine = 'Simulador IA: ' + (sim.negocio ? negocioRef : T.none) +
        ' · mencionado: ' + (sim.mentioned === null ? T.none : (sim.mentioned ? T.yes : T.no));

      setFeedback('', '');
      btn.classList.add('loading');
      label.textContent = T.sending;
      btn.disabled = true;

      var eventId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2);
      var payload = {
        nombre: nombre,
        email: email,
        empresa: sitio || sim.negocio,
        servicio: 'auditoria-gratis',
        tiene_sitio: conSitio ? 'si' : 'no',
        sitio: sitio || negocioRef,
        mensaje: (conSitio
          ? 'Solicitud de auditoría exprés gratis (desde /ia/).\nSitio a revisar: ' + sitio
          : 'Solicitud de auditoría exprés gratis (desde /ia/, SIN SITIO WEB → diagnóstico de presencia local).\nNegocio: ' + (negocioRef || '—'))
          + '\n' + simLine,
        whatsapp: whatsapp,
        cf_turnstile_response: turnstileToken(form),
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
          label.textContent = T.leadLabel;
          resetTurnstile(form);
          if (res.ok) {
            pushDL({ event: 'lead_form_submit', form_type: 'auditoria-gratis', segmento_sitio: conSitio ? 'con-sitio' : 'sin-sitio', origen: 'simulador-ia', event_id: eventId });
            setFeedback('success');
            form.reset();
          } else {
            return res.json().then(function (data) {
              setFeedback('error', (data && data.error) || T.leadErr);
            }).catch(function () {
              setFeedback('error', T.leadErr);
            });
          }
        })
        .catch(function () {
          btn.classList.remove('loading');
          btn.disabled = false;
          label.textContent = T.leadLabel;
          setFeedback('error', T.offline);
        });
    });
  }

  /* Línea superior de las ventanas en touch (reveal-cards no cubre .ia-chat) */
  function initReveal() {
    if (!window.IntersectionObserver || !window.matchMedia('(hover: none)').matches) return;
    var els = document.querySelectorAll('.ia-chat');
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) { entries[i].target.classList.add('in-view'); io.unobserve(entries[i].target); }
      }
    }, { threshold: 0.2 });
    for (var j = 0; j < els.length; j++) io.observe(els[j]);
  }

  initDemo();
  initSimulator();
  initLead();
  initReveal();
})();
