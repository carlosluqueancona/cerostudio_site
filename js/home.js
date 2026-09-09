    document.addEventListener('DOMContentLoaded', function () {
      gsap.registerPlugin(ScrollTrigger);

      /* ── LOGO TICKER (setTimeout → no bloquea DOMContentLoaded) ── */
      setTimeout(function () {
        const track = document.querySelector('.ticker-track');
        if (!track) return;
        gsap.fromTo(track,
          { xPercent: 0 },
          { xPercent: -50, duration: 28, ease: 'none', repeat: -1, force3D: true }
        );
      }, 0);

      /* ── TEXT SCRAMBLE ─────────────────────────────────────────── */
      class TextScramble {
        constructor(el) {
          this.el = el;
          this.el.style.opacity = 1; // Reveal element when beginning scramble
          this.chars = '!<>-_\\/[]{}—=+*^?#@ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          this.update = this.update.bind(this);
        }
        run(text) {
          return new Promise(resolve => {
            this.resolve = resolve; this.queue = []; this.frame = 0;
            for (let i = 0; i < text.length; i++) {
              const start = Math.floor(i * 1.6);
              this.queue.push({ to: text[i], start, end: start + 8 + Math.floor(Math.random() * 6), char: '' });
            }
            cancelAnimationFrame(this.raf);
            this.update();
          });
        }
        update() {
          let html = '', complete = 0;
          for (const item of this.queue) {
            if (this.frame >= item.end) { complete++; html += item.to; }
            else if (this.frame >= item.start) {
              if (!item.char || Math.random() < .3) item.char = this.chars[Math.floor(Math.random() * this.chars.length)];
              html += `<span class="scramble-char">${item.char}</span>`;
            } else { html += `<span class="scramble-char" style="opacity:0">${item.to}</span>`; }
          }
          this.el.innerHTML = html;
          if (complete === this.queue.length) { this.resolve(); return; }
          this.frame++;
          this.raf = requestAnimationFrame(this.update);
        }
      }

      /* ── LOADER → HERO ─────────────────────────────────────────── */
      /* Skip loader on repeat visits — LCP improvement for returning users */
      if (sessionStorage.getItem('cs_v')) {
        document.getElementById('loader').style.display = 'none';
        setTimeout(runHeroEntrance, 0); /* diferir para que CS_HERO_TEXTS y CS_LANG estén inicializados */
      } else {
        sessionStorage.setItem('cs_v', '1');
        /* runHeroEntrance arranca ANTES del fade del loader: el scramble ya corre
           cuando el hero se descubre y nunca se ve el título estático "ya puesto" */
        gsap.timeline()
          .to('#ldLogo', { opacity: 1, duration: .4, ease: 'power2.out' })
          .to('#ldBar', { width: '100%', duration: .5, ease: 'power2.inOut' }, '-=.1')
          .call(runHeroEntrance)
          .to('#loader', { opacity: 0, duration: .6, ease: 'power2.out' }, '+=.1')
          .set('#loader', { display: 'none' });
      }

      function runHeroEntrance() {
        gsap.set('.hero-static-title', { opacity: 1 });   /* revelamos el contenedor */
        gsap.to('#heroEyebrow', { opacity: 1, duration: .8, ease: 'power2.out' });

        var _heroT = (typeof CS_HERO_TEXTS !== 'undefined' && typeof CS_LANG !== 'undefined') ? CS_HERO_TEXTS[CS_LANG] : [
          { el: 'scrL1',  text: 'PRESENCIA', delay: 200 },
          { el: 'scrL2a', text: 'DIGITAL',   delay: 340 },
          { el: 'scrL2b', text: 'QUE',       delay: 520 },
          { el: 'scrL3',  text: 'VENDE.',    delay: 660 },
        ];
        /* tipografía viva: arranca cuando TODOS los scrambles terminaron */
        var _scrDone = [];
        _heroT.forEach(({ el, text, delay }) => {
          var node = typeof el === 'string' ? document.getElementById(el) : el;
          if (node) _scrDone.push(new Promise(res => setTimeout(() => new TextScramble(node).run(text).then(res), delay)));
        });
        Promise.all(_scrDone).then(initHeroType);

        setTimeout(() => {
          gsap.to('#heroSub', { opacity: 1, duration: .85, ease: 'power3.out' });
          /* plan 2026-09: #heroProof (línea de prueba) entra con los botones */
          gsap.to('#heroActions, #heroProof', { opacity: 1, duration: .75, ease: 'power3.out', delay: .18 });
        }, 1600);
      }



      /* ── TIPOGRAFÍA VIVA (hero) ─────────────────────────────────
         Space Grotesk variable: cada palabra baja de 'wght' 700 → 500 y se
         inclina (skewX −2°) según la distancia del puntero (radio 320px);
         en touch el peso "respira" con el scroll del primer viewport.
         Solo transform + font-variation-settings, lerp en rAF. Se llama al
         terminar el scramble (runHeroEntrance). Sin reacción con reduced-motion. */
      function initHeroType() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        var hero = document.getElementById('hero');
        var words = Array.prototype.slice.call(document.querySelectorAll('.hero-static-title span[data-hero-line]'));
        if (!hero || !words.length) return;
        var W_MAX = 700, W_MIN = 500, SKEW = -2, RADIUS = 320;
        var st = words.map(function (el) { return { el: el, w: W_MAX, tw: W_MAX, r: null }; });
        var raf = null;

        /* caja real del texto (no del bloque) en coordenadas de documento */
        function measure() {
          var sy = window.scrollY;
          st.forEach(function (s) {
            var r = document.createRange(); r.selectNodeContents(s.el);
            var b = r.getBoundingClientRect();
            s.r = { l: b.left, t: b.top + sy, r: b.right, b: b.bottom + sy };
          });
        }
        function tick() {
          raf = null;
          var busy = false;
          st.forEach(function (s) {
            var d = s.tw - s.w;
            if (Math.abs(d) < .3) { if (s.w === s.tw) return; s.w = s.tw; }
            else { s.w += d * .14; busy = true; }
            var t = (W_MAX - s.w) / (W_MAX - W_MIN);   /* 0 reposo → 1 reacción plena */
            s.el.style.fontVariationSettings = "'wght' " + s.w.toFixed(1);
            s.el.style.transform = t < .002 ? '' : 'skewX(' + (SKEW * t).toFixed(2) + 'deg)';
          });
          if (busy) raf = requestAnimationFrame(tick);
        }
        function kick() { if (!raf) raf = requestAnimationFrame(tick); }
        function rest() { st.forEach(function (s) { s.tw = W_MAX; }); kick(); }

        if (window.matchMedia('(hover: none)').matches) {
          /* touch: respira con el scroll; cada renglón entra un poco después */
          var lastT = -1;
          window.addEventListener('scroll', function () {
            var sy = window.scrollY, vh = window.innerHeight;
            var tt = Math.min(sy / (vh * .6), 1);
            if (tt === lastT) return;
            lastT = tt;
            st.forEach(function (s, i) {
              var t = Math.max(0, Math.min(1, tt * 1.3 - i * .1));
              t = t * t * (3 - 2 * t);
              s.tw = W_MAX - (W_MAX - W_MIN) * t;
            });
            kick();
          }, { passive: true });
          return;
        }

        var px = 0, py = 0, inside = false;
        function aim() {
          if (!st[0].r) measure();
          var sy = window.scrollY, x = px, y = py + sy;
          st.forEach(function (s) {
            var dx = Math.max(s.r.l - x, 0, x - s.r.r);
            var dy = Math.max(s.r.t - y, 0, y - s.r.b);
            var d = Math.sqrt(dx * dx + dy * dy);
            var t = d >= RADIUS ? 0 : 1 - d / RADIUS;
            t = t * t * (3 - 2 * t);
            s.tw = W_MAX - (W_MAX - W_MIN) * t;
          });
          kick();
        }
        hero.addEventListener('mousemove', function (e) { px = e.clientX; py = e.clientY; inside = true; aim(); }, { passive: true });
        hero.addEventListener('mouseleave', function () { inside = false; rest(); });
        window.addEventListener('scroll', function () { if (inside) aim(); }, { passive: true });
        var rT = null;
        window.addEventListener('resize', function () {
          clearTimeout(rT);
          rT = setTimeout(function () { rest(); st.forEach(function (s) { s.r = null; }); }, 150);
        });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { st.forEach(function (s) { s.r = null; }); });
      }

      /* ── NAV ───────────────────────────────────────────────────── */
      window.addEventListener('scroll', () => {
        var nb = document.getElementById('navbar');
        if (nb) nb.classList.toggle('scrolled', window.scrollY > 60);
      }, { passive: true });

      /* ── MOBILE NAV ────────────────────────────────────────────── */
      let navOpen = false;
      function toggleNav() {
        navOpen = !navOpen;
        const ham = document.getElementById('navHam');
        document.getElementById('mobileNav').classList.toggle('open', navOpen);
        ham.classList.toggle('open', navOpen);
        ham.setAttribute('aria-expanded', String(navOpen));
        ham.setAttribute('aria-label', navOpen ? 'Cerrar menú' : 'Abrir menú');
        document.body.style.overflow = navOpen ? 'hidden' : '';
      }
      function closeNav() {
        navOpen = false;
        const ham = document.getElementById('navHam');
        document.getElementById('mobileNav').classList.remove('open');
        ham.classList.remove('open');
        ham.setAttribute('aria-expanded', 'false');
        ham.setAttribute('aria-label', 'Abrir menú');
        document.body.style.overflow = '';
      }

      /* ── SMOOTH SCROLL ─────────────────────────────────────────── */
      document.querySelectorAll('a[href^="#"]:not(.port-card)').forEach(a => {
        a.addEventListener('click', e => {
          const id = a.getAttribute('href');
          if (id === '#') return;
          const t = document.querySelector(id);
          if (!t) return;
          e.preventDefault();
          const nh = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nh'));
          window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - nh, behavior: 'smooth' });
        });
      });

      /* ── PLAN CTA → preselecciona servicio y prellena mensaje ──── */
      /* plan 2026-09 (LEAD-04): el plan elegido también contextualiza los
         WhatsApp del home + chrome y se guarda para el panel post-envío */
      var CS_WA_NUM = '525531007101';
      var CS_PLAN = null; /* { service, name } del último CTA de plan clicado */
      function planWaText(service, name, lang) {
        if (service === 'ecommerce') {
          var store = name.replace(/^Tienda\s+/, '');
          return lang === 'en'
            ? "Hi, I'm interested in the " + (store === 'Esencial' ? 'Essential' : store) + " Tiendanube store. What's next?"
            : 'Hola, me interesa la ' + name + ' en Tiendanube. ¿Qué sigue?';
        }
        if (service === 'auditoria-gratis') {
          return lang === 'en'
            ? "Hi, I'd like my free express audit — my site is: "
            : 'Hola, quiero mi auditoría exprés gratis — mi sitio es: ';
        }
        return lang === 'en'
          ? "Hi, I saw your pricing on cerostudio.ai and I'm interested in the " + name + ' plan. What do you need from me to get started?'
          : 'Hola, vi los precios en cerostudio.ai y me interesa el plan ' + name + '. ¿Qué necesitas de mí para empezar?';
      }
      function waHref(text) { return 'https://wa.me/' + CS_WA_NUM + '?text=' + encodeURIComponent(text); }
      /* Actualiza href + data-wa-es/en (así setLang, que re-aplica data-wa-*, no pisa el contexto) */
      function setContextWa(service, name) {
        var es = waHref(planWaText(service, name, 'es')), en = waHref(planWaText(service, name, 'en'));
        document.querySelectorAll('#contact-wa, .contact-link-row[href*="wa.me"], .float-wa, .mob-bar-wa, #mnav-wa').forEach(function (el) {
          el.dataset.waEs = es; el.dataset.waEn = en;
          el.href = CS_LANG === 'en' ? en : es;
        });
      }
      document.querySelectorAll('[data-plan-service]').forEach(a => {
        a.addEventListener('click', () => {
          const f = document.getElementById('contactForm');
          if (!f) return;
          const sel = f.querySelector('[name="servicio"]');
          if (sel) { sel.value = a.dataset.planService; sel.dispatchEvent(new Event('change')); }
          CS_PLAN = { service: a.dataset.planService, name: a.dataset.planName };
          setContextWa(CS_PLAN.service, CS_PLAN.name);
          const msg = f.querySelector('[name="mensaje"]');
          /* la auditoría captura el sitio en su propio bloque: no prellena "plan" */
          if (msg && !msg.value.trim() && a.dataset.planService !== 'auditoria-gratis')
            msg.value = CS_LANG === 'en'
              ? "I'm interested in the " + a.dataset.planName + ' plan.'
              : 'Me interesa el plan ' + a.dataset.planName + '.';
        });
      });

      /* ── SCROLL REVEALS + COUNTERS (idle — no bloquean LCP) ───── */
      (window.requestIdleCallback || (cb => setTimeout(cb, 200)))(function () {
        gsap.utils.toArray('.sr').forEach(el => {
          gsap.fromTo(el, { opacity: 0, y: 48 }, {
            opacity: 1, y: 0, duration: .95, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
          });
        });

        gsap.utils.toArray('.port-card').forEach((card, i) => {
          gsap.fromTo(card, { opacity: 0, y: 40 }, {
            opacity: 1, y: 0, duration: .8, ease: 'power3.out',
            delay: (i % 4) * .07,
            scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none none' }
          });
        });

        /* Cifras fantasma de sección: lime mientras la sección está activa
           + parallax suave (−60 → 60px) con scrub. Sin parallax con reduced-motion. */
        var _rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        document.querySelectorAll('.sec-ghost').forEach(g => {
          var sec = g.closest('section');
          if (!sec) return;
          ScrollTrigger.create({
            trigger: sec, start: 'top 60%', end: 'bottom 40%',
            toggleClass: { targets: g, className: 'is-lit' }
          });
          if (_rm) return;
          gsap.fromTo(g, { y: -60 }, {
            y: 60, ease: 'none',
            scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: .6 }
          });
        });

        document.querySelectorAll('.stat-num').forEach(el => {
          const target = parseInt(el.dataset.target), suffix = el.dataset.suffix || '';
          let started = false;
          ScrollTrigger.create({
            trigger: el, start: 'top 88%', onEnter() {
              if (started) return; started = true;
              const t0 = performance.now();
              (function step(now) {
                const p = Math.min((now - t0) / 1600, 1);
                /* dígitos outline que se rellenan de lime junto con el conteo */
                el.innerHTML = Math.round((1 - Math.pow(1 - p, 3)) * target) +
                  (suffix ? '<span class="stat-sfx">' + suffix + '</span>' : '');
                el.style.setProperty('--fill', (p * 100) + '%');
                if (p < 1) requestAnimationFrame(step);
              })(t0);
            }
          });
        });
      });

      /* ── CURSOR (rAF — sin tweens GSAP por mousemove) ─────────── */
      const dot = document.getElementById('cDot'), ring = document.getElementById('cRing');
      let _mx = 0, _my = 0, _rx = 0, _ry = 0, _craf = null;
      document.addEventListener('mousemove', e => {
        _mx = e.clientX; _my = e.clientY;
        if (!_craf) _craf = requestAnimationFrame(_stepCursor);
      });
      function _stepCursor() {
        _craf = null;
        dot.style.transform  = 'translate(calc(' + _mx + 'px - 50%), calc(' + _my + 'px - 50%))';
        _rx += (_mx - _rx) * 0.18;
        _ry += (_my - _ry) * 0.18;
        ring.style.transform = 'translate(calc(' + _rx + 'px - 50%), calc(' + _ry + 'px - 50%))';
        if (Math.abs(_mx - _rx) > 0.5 || Math.abs(_my - _ry) > 0.5)
          _craf = requestAnimationFrame(_stepCursor);
      }
      document.querySelectorAll('.ht').forEach(el => {
        el.addEventListener('mouseenter', () => ring.classList.add('on'));
        el.addEventListener('mouseleave', () => ring.classList.remove('on'));
      });





      /* ══════════════════════════════════════════════════════════
         HERO FX — switch de animación del hero:
           'pulse' = El Pulso de Venta (electrocardiograma de ventas)
           'field' = líneas magnéticas (versión anterior, intacta)
         Para reactivar el hero anterior: cambiar a 'field' y bump ?v=
      ══════════════════════════════════════════════════════════ */
      var CS_HERO_FX = 'field';

      /* Hero 'pulse' (gráficas de venta/visitas) extraído a js/hero-pulse.js — versión guardada para /servicios/seo/ (aún no montada). La home usa CS_HERO_FX='field'. */

      /* ── HERO — MAGNETIC FIELD LINES (legacy — CS_HERO_FX='field') ── */
      if (CS_HERO_FX === 'field')
      (window.requestIdleCallback || (cb => setTimeout(cb, 200)))(function () {
      (function () {
        const canvas = document.getElementById('heroCanvas');
        if (!canvas) return;

        // Respect prefers-reduced-motion: skip animation entirely, render a static frame
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        /* ── RUTA PRINCIPAL: Web Worker en dos sabores ────────────────
           La matemática (~250k evaluaciones de campo/frame) SIEMPRE va a
           js/hero-field-worker.js en un hilo aparte, a densidad completa:

           · render  (Chrome/Edge/Firefox): OffscreenCanvas transferido —
             el worker también rasteriza. Main thread 100% libre.
           · compute (Safari/WebKit): su OffscreenCanvas 2D en worker
             rasteriza por SOFTWARE y se traba, así que el worker solo
             CALCULA y manda polilíneas empacadas (Float32Array
             transferible); el main solo hace ≤6 stroke() con GPU (~2-4ms
             por frame a 30fps). navigator.vendor: 'Apple Computer, Inc.'
             en Safari; Chrome/Edge reportan 'Google Inc.'

           El código inline de abajo queda solo como fallback sin Worker. */
        const isSafari = /apple/i.test(navigator.vendor || '');
        if (window.Worker && (canvas.transferControlToOffscreen || isSafari)) {
          const useOffscreen = !isSafari && !!canvas.transferControlToOffscreen;
          const worker = new Worker('/js/hero-field-worker.js?v=20260720g');

          if (useOffscreen) {
            const off = canvas.transferControlToOffscreen();
            worker.postMessage({
              type: 'init', canvas: off,
              w: window.innerWidth, h: window.innerHeight,
              dpr: window.devicePixelRatio || 1,
              reduced: prefersReducedMotion
            }, [off]);
          } else {
            const mctx = canvas.getContext('2d');
            let buckets = null, pendingBuf = null, rafDraw = 0, LW = 0, LH = 0;
            var sizeCanvasMain = function () {
              LW = window.innerWidth; LH = window.innerHeight;
              /* Safari: 1× CSS (sin DPR) — equilibrio nitidez/costo: a 0.55×
                 las líneas se veían pixeladas; el raster sigue acotado por
                 24fps + sin 'lighter' + decimate 2:1 */
              const RES = 1;
              canvas.width = Math.round(LW * RES);
              canvas.height = Math.round(LH * RES);
              mctx.setTransform(RES, 0, 0, RES, 0, 0);
            };
            sizeCanvasMain();
            /* dibuja el ÚLTIMO frame recibido en el siguiente rAF (si llegan
               dos antes de pintar, el viejo se descarta — nunca hay cola) */
            const drawBuf = function () {
              rafDraw = 0;
              const f = pendingBuf; pendingBuf = null;
              if (!f || !buckets) return;
              const a = new Float32Array(f);
              let o = 0;
              const nb = a[o++];
              mctx.clearRect(0, 0, LW, LH);
              /* sin 'lighter' en Safari: el blending aditivo es lo más caro
                 de su raster; source-over se ve un poco más plano pero fluye */
              for (let i = 0; i < nb; i++) {
                const nl = a[o++];
                if (!nl) continue;
                const p = new Path2D();
                for (let l = 0; l < nl; l++) {
                  const np = a[o++];
                  p.moveTo(a[o], a[o + 1]); o += 2;
                  for (let j = 1; j < np; j++) { p.lineTo(a[o], a[o + 1]); o += 2; }
                }
                const b = buckets[i];
                mctx.strokeStyle = b.lime
                  ? 'rgba(178,247,0,' + b.alpha + ')'
                  : 'rgba(255,255,255,' + b.alpha + ')';
                mctx.lineWidth = b.lw;
                mctx.stroke(p);
              }
            };
            worker.onmessage = function (e) {
              const m = e.data;
              if (m.type === 'frame') {
                pendingBuf = m.buf;
                if (!rafDraw) rafDraw = requestAnimationFrame(drawBuf);
              } else if (m.type === 'buckets') buckets = m.buckets;
            };
            worker.postMessage({
              type: 'init',
              w: window.innerWidth, h: window.innerHeight,
              reduced: prefersReducedMotion,
              /* Safari: 24fps y polilíneas con la mitad de puntos — menos
                 lineTo() y menos raster en el main thread */
              fps: 24, decimate: 2
            });
          }

          if (!prefersReducedMotion) {
            /* el worker anima con setInterval (su rAF es poco confiable), así
               que el main thread lo pausa cuando el hero sale del viewport O
               la pestaña se oculta — si no, seguiría quemando CPU de fondo.
               El primer callback del IO llega con el estado actual → arranca solo. */
            let heroVis = true;
            const sendVis = () => worker.postMessage({
              type: 'vis', visible: heroVis && document.visibilityState === 'visible'
            });
            new IntersectionObserver(entries => {
              heroVis = entries[0].isIntersecting; sendVis();
            }, { threshold: 0 }).observe(canvas.parentElement);
            document.addEventListener('visibilitychange', sendVis);
          }
          window.addEventListener('resize', () => {
            if (!useOffscreen) sizeCanvasMain();
            worker.postMessage({
              type: 'size', w: window.innerWidth, h: window.innerHeight,
              dpr: window.devicePixelRatio || 1
            });
          });
          return;
        }

        const ctx = canvas.getContext('2d');
        let W, H, t = 0, seeds = [];

        // More poles than hero3 (8 vs 6), tighter spread for wilder crossings
        const poles = [
          { fx: .18, fy: .28, q: 1 },
          { fx: .82, fy: .72, q: -1 },
          { fx: .55, fy: .12, q: 1 },
          { fx: .35, fy: .82, q: -1 },
          { fx: .74, fy: .24, q: 1 },
          { fx: .26, fy: .76, q: -1 },
          { fx: .50, fy: .50, q: 1 },  // central attractor
          { fx: .88, fy: .42, q: -1 },  // right-side extra
        ];

        function resize() {
          W = window.innerWidth;
          H = window.innerHeight;
          /* Backing store a 0.7× en desktop: las líneas son difusas y el canvas
             estirado por CSS (width/height:100%) no se distingue a simple vista,
             pero el rasterizado con 'lighter' cuesta ~la mitad. Mobile ya corre
             a resolución CSS (sin DPR) — se queda en 1×. Toda la matemática
             sigue en px lógicos vía setTransform. */
          const RES = W < 768 ? 1 : 0.7;
          canvas.width = Math.round(W * RES);
          canvas.height = Math.round(H * RES);
          ctx.setTransform(RES, 0, 0, RES, 0, 0);
        }

        function buildSeeds() {
          const isMobile = W < 768;
          /* FALLBACK sin worker: densidad reducida (60 vs 130 líneas) — aquí
             la animación comparte hilo con el cursor y no hay otra forma de
             no bloquearlo. La versión completa vive en hero-field-worker.js. */
          const LINES = isMobile ? 45 : 60;
          seeds = [];

          // Perimeter seeds
          for (let i = 0; i < LINES; i++) {
            const a = (i / LINES) * Math.PI * 2;
            const lime = Math.random() < (i % 4 === 0 ? .75 : .22);  // varied lime ratio
            // Each seed gets its own step size and drift amplitude for variety
            seeds.push({
              x: W * .5 + Math.cos(a) * W * .47,
              y: H * .5 + Math.sin(a) * H * .45,
              lime,
              step: (isMobile ? 11 : 7) + Math.random() * 8,
              steps: (isMobile ? 60 : 90) + Math.floor(Math.random() * (isMobile ? 40 : 70)),   // fallback: trazos más cortos
              drift: 30 + Math.random() * 55,         // drift amplitude 30–85px
              driftSpd: .3 + Math.random() * .5,     // drift speed per seed
              lw: lime ? .8 + Math.random() * 1.6 : .4 + Math.random() * .8,
              alpha: lime ? .28 + Math.random() * .25 : .08 + Math.random() * .12,
            });
          }

          // Extra seeds near each pole for chaotic density
          for (const p of poles) {
            const innerLines = isMobile ? 2 : 3;   /* fallback: mitad de líneas por polo */
            for (let k = 0; k < innerLines; k++) {
              const a = (k / innerLines) * Math.PI * 2;
              const lime = p.q > 0;
              seeds.push({
                x: p.fx * W + Math.cos(a) * 90,
                y: p.fy * H + Math.sin(a) * 90,
                lime,
                step: (isMobile ? 12 : 8) + Math.random() * 10,
                steps: (isMobile ? 50 : 100) + Math.floor(Math.random() * (isMobile ? 40 : 80)),
                drift: 15 + Math.random() * 35,
                driftSpd: .5 + Math.random() * .7,
                lw: lime ? 1.0 + Math.random() * 1.8 : .5 + Math.random() * .6,
                alpha: lime ? .35 + Math.random() * .30 : .07 + Math.random() * .10,
              });
            }
          }

          for (const s of seeds) s.bucket = bucketFor(s);
        }

        /* Cubetas de estilo: en vez de ~178 stroke() por frame (uno por línea),
           las polilíneas se acumulan en un Path2D por cubeta y se trazan en
           ≤6 stroke(). El alpha/grosor de cada línea (random de origen) se
           cuantiza a la cubeta más cercana — el ojo no distingue la diferencia.
           Nota: cruces de líneas de la MISMA cubeta ya no suman con 'lighter'
           (un solo stroke pinta cada px una vez); entre cubetas sí siguen sumando. */
        const BUCKETS = [
          { lime: true,  alpha: .32, lw: 1.1 },
          { lime: true,  alpha: .48, lw: 1.8 },
          { lime: true,  alpha: .62, lw: 2.4 },
          { lime: false, alpha: .09, lw: .6 },
          { lime: false, alpha: .14, lw: .9 },
          { lime: false, alpha: .19, lw: 1.2 },
        ];
        function bucketFor(seed) {
          let best = 0, bd = 1e9;
          for (let i = 0; i < BUCKETS.length; i++) {
            const b = BUCKETS[i];
            if (b.lime !== seed.lime) continue;
            const d = Math.abs(b.alpha - seed.alpha) + Math.abs(b.lw - seed.lw) * .15;
            if (d < bd) { bd = d; best = i; }
          }
          return best;
        }

        let currentPoles = [];

        function field(x, y) {
          let fx = 0, fy = 0;
          for (let i = 0; i < currentPoles.length; i++) {
            const p = currentPoles[i];
            const dx = x - p.px, dy = y - p.py;
            const d2 = dx * dx + dy * dy;
            const d = Math.sqrt(d2) + 1;
            const force = p.q / (d2 * .0008 + d);
            fx += dx * force;
            fy += dy * force;
          }
          const mag = Math.sqrt(fx * fx + fy * fy) + .0001;
          return { vx: fx / mag, vy: fy / mag };
        }

        let rafId;
        /* 30 fps en TODOS los dispositivos: el drift de los polos es lento y a
           30fps no se percibe la diferencia, pero cada frame saltado deja los
           ~16ms completos libres para el cursor rAF y el scroll (el field era
           quien se los comía en desktop). */
        const frameInterval = 1000 / 30;
        let lastFrameTime = 0;

        function renderFrame() {
          ctx.clearRect(0, 0, W, H);
          ctx.globalCompositeOperation = 'lighter';
          t += .0085;  // ~2× faster time than hero3 (.004)

          currentPoles = poles.map(p => ({
            px: p.fx * W + Math.sin(t * 1.1 + p.fy * 5) * 85,
            py: p.fy * H + Math.cos(t * .85 + p.fx * 5) * 72,
            q: p.q
          }));

          const paths = new Array(BUCKETS.length).fill(null);
          for (const seed of seeds) {
            const drift = t * seed.driftSpd;
            let x = seed.x + Math.sin(drift + seed.x * .002) * seed.drift;
            let y = seed.y + Math.cos(drift * .8 + seed.y * .002) * seed.drift * .7;

            const p = paths[seed.bucket] || (paths[seed.bucket] = new Path2D());
            p.moveTo(x, y);
            for (let s = 0; s < seed.steps; s++) {
              const { vx, vy } = field(x, y);
              x += vx * seed.step;
              y += vy * seed.step;
              if (x < -80 || x > W + 80 || y < -80 || y > H + 80) break;
              p.lineTo(x, y);
            }
          }

          for (let i = 0; i < BUCKETS.length; i++) {
            if (!paths[i]) continue;
            const b = BUCKETS[i];
            ctx.strokeStyle = b.lime
              ? `rgba(178,247,0,${b.alpha})`
              : `rgba(255,255,255,${b.alpha})`;
            ctx.lineWidth = b.lw;
            ctx.stroke(paths[i]);
          }
        }

        function draw(now) {
          rafId = requestAnimationFrame(draw);
          if (now - lastFrameTime < frameInterval) return;
          lastFrameTime = now;
          renderFrame();
        }

        resize(); buildSeeds();

        if (prefersReducedMotion) {
          // Render a single static frame and exit — no animation loop
          renderFrame();
        } else {
          new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
              if (!rafId) { lastFrameTime = 0; rafId = requestAnimationFrame(draw); }
            } else if (rafId) {
              cancelAnimationFrame(rafId); rafId = null;
            }
          }, { threshold: 0 }).observe(canvas.parentElement);
        }
        window.addEventListener('resize', () => {
          resize(); buildSeeds();
          if (prefersReducedMotion) renderFrame();
        });
      })();
      }); /* end requestIdleCallback */




      /* ══════════════════════════════════════════════════════════════
         SISTEMA BILINGÜE — ES / EN
         setLang(lang) aplica todas las traducciones al DOM.
         toggleLang()  alterna y persiste en localStorage.
         Al cargar: lee localStorage, si no existe detecta navigator.language.
      ══════════════════════════════════════════════════════════════ */

      var CS_LANG = 'es'; /* estado activo */

      var CS_I18N = {
        es: {
          /* ── LOADER */
          'ldLbl': { t: 'Cargando' },
          /* ── NAV */
          'nav-servicios': { t: 'Servicios' },
          'nav-portafolio': { t: 'Portafolio' },
          'nav-nosotros': { t: 'Nosotros' },
          'nav-precios': { t: 'Precios' },
          'nav-contacto': { t: 'Contacto' },
          'nav-blog': { t: 'Blog' },
          'nav-cta': { t: 'Iniciar Proyecto' },
          'mnav-servicios': { t: 'Servicios' },
          'mnav-portafolio': { t: 'Portafolio' },
          'mnav-nosotros': { t: 'Nosotros' },
          'mnav-precios': { t: 'Precios' },
          'mnav-contacto': { t: 'Contacto' },
          'mnav-blog': { t: 'Blog' },
          /* plan 2026-09: chrome site-wide (partials de WS-E) */
          'mnav-cta': { t: 'Iniciar Proyecto' },
          'mnav-wa': { t: 'WhatsApp directo' },
          'mob-bar-main': { t: 'Cotizar mi proyecto' },
          /* ── HERO */
          'heroEyebrow': { t: 'Clientes, no solo visitas.' },
          'heroSub': { t: 'Tu negocio ya es bueno. Te falta el sitio que lo demuestre y convierta a quien te busca en cliente — hecho a tu medida, desde $299 USD (≈ $5,400 MXN) y listo en 5 días hábiles.' },
          'hero-btn-audit': { t: 'Auditoría gratis de mi sitio →' },
          'hero-btn-quote': { t: 'Iniciar Proyecto' },
          'heroProof': { h: '25+ años de oficio · Hablas directo con Carlos · Fecha de entrega por escrito · Agencia Tiendanube Partner certificada — <a href="/casos-de-exito/" data-href-es="/casos-de-exito/" data-href-en="/en/case-studies/">Ver casos de éxito →</a>' },
          /* ── MARQUEE */
          'marquee-1': { h: 'Diseño Web <em>·</em> eCommerce <em>·</em> Branding <em>·</em> SEO <em>·</em> Desarrollo <em>·</em> Consultoría <em>·</em> Mantenimiento <em>·</em> Identidad Visual <em>·</em>' },
          'marquee-2': { h: 'Diseño Web <em>·</em> eCommerce <em>·</em> Branding <em>·</em> SEO <em>·</em> Desarrollo <em>·</em> Consultoría <em>·</em> Mantenimiento <em>·</em> Identidad Visual <em>·</em>' },
          'ticker-label': { t: 'Marcas con las que Carlos ha trabajado' },
          /* ── SERVICIOS */
          'srv-eyebrow': { t: '01 — Servicios' },
          'srv-title': { h: 'Todo lo que necesitas<br>para <span class="t-outline">vender</span> en línea' },
          'srv-desc': { t: 'Escoge solo lo que tu negocio necesita hoy. Cada servicio está hecho para lo mismo: que te encuentren, que confíen en ti y que te compren.' },
          'srv-t1': { t: 'Desarrollo Web' }, 'srv-d1': { t: 'Sitios rápidos, modernos y optimizados que generan confianza y convierten visitantes en clientes desde el primer clic.' },
          'srv-t2': { t: 'Tiendas eCommerce' }, 'srv-d2': { t: 'Tu negocio abierto 24/7. Tiendas online completas con pasarelas de pago, inventario y experiencia de compra fluida.' },
          'srv-t3': { t: 'Branding Digital' }, 'srv-d3': { t: 'Identidad visual profesional que diferencia tu marca y genera la confianza que tu audiencia necesita ver.' },
          'srv-t4': { t: 'SEO + AI Search' }, 'srv-d4': { t: 'Posicionamiento en Google + visibilidad en ChatGPT, Claude, Gemini y Perplexity. Que tus clientes te encuentren — buscando o preguntando.' },
          'srv-t5': { t: 'Mantenimiento' }, 'srv-d5': { t: 'Soporte técnico continuo, actualizaciones de seguridad y optimización para que tu sitio funcione perfecto siempre.' },
          'srv-t6': { t: 'Consultoría Digital' }, 'srv-d6': { t: 'Estrategia digital personalizada para escalar tu negocio. Tomamos las decisiones correctas antes de escribir código.' },
          'srv-l1': { t: 'Ver ficha →' },
          'srv-l2': { t: 'Ver ficha →' },
          'srv-l3': { t: 'Ver ficha →' },
          'srv-l4': { t: 'Ver ficha →' },
          'srv-l5': { t: 'Ver ficha →' },
          'srv-l6': { t: 'Ver ficha →' },
          /* ── PORTAFOLIO */
          'port-title': { h: 'Proyectos que hacen<br>la <span class="t-outline">diferencia</span>' },
          'port-start-btn': { t: 'Iniciar Proyecto' },
          'port-cta-q': { h: '¿Tu negocio<br>aquí?' },
          'port-cta-sub': { t: 'Tu caso puede ser el siguiente: 3× retorno en IMVEC, +40% en Mainoflex' },
          'port-cta-btn': { t: 'Iniciar Proyecto' },
          'port-more': { t: 'Ver todos los proyectos →' }, /* plan 2026-09: A2 sustituye por «Ver los N proyectos →» con el conteo real */
          'plan-more': { t: 'Ver todo lo que incluye' }, /* plan 2026-09: pricing móvil; JS concatena (+N) */
          'plan-less': { t: 'Ver menos' },
          'port-badge': { t: 'Ver Proyecto →' },
          'port-c1': { t: 'Agencia · Modelos & Producción BTL' },
          'port-d1': { t: 'Plataforma digital para agencia de modelos, edecanes y producción de eventos corporativos.' },
          'port-c2': { t: 'Imprenta · Cotizaciones en línea' },
          'port-d2': { t: 'Sitio corporativo para imprenta offset con cotizador de productos integrado.' },
          'port-c3': { t: 'Automotriz · Inventario en línea' },
          'port-d3': { t: 'Catálogo digital de vehículos con buscador avanzado y fichas técnicas detalladas.' },
          'port-c4': { t: 'Agencia · Talento & Activaciones BTL' },
          'port-d4': { t: 'Sitio para agencia de talento profesional con activaciones BTL e infraestructura para eventos.' },
          'port-c5': { t: 'Industrial · Soluciones antivibratorias' },
          'port-d5': { t: 'Catálogo y tienda online para distribuidora de productos de mantenimiento industrial.' },
          'port-c6': { t: 'Manufactura · Estanterías y exhibidores' },
          'port-d6': { t: 'Tienda multimarca con sistema de inventario en tiempo real y catálogo dinámico.' },
          'port-c7': { t: 'Tienda online · Mascotas' },
          'port-d7': { t: 'Tienda online de alta calidad para el cuidado y bienestar de mascotas.' },
          'port-c8': { t: 'Educación · Inscripciones digitales' },
          'port-d8': { t: 'Portal institucional para centro de investigación con gestión editorial avanzada.' },
          'port-c9': { t: 'Industrial · Fabricación metálica' },
          'port-d9': { t: 'Portal empresarial con presentación institucional y gestión de proyectos activos.' },
          'port-c10': { t: 'Tienda online · Gatos' },
          'port-d10': { t: 'E-commerce especializado en productos y accesorios premium para gatos.' },
          'port-c11': { t: 'Salud · Neumología' },
          'port-d11': { t: 'Plataforma de salud respiratoria con recursos educativos y consultas en línea.' },
          'port-c12': { t: 'Bienestar · Sanación Holística' },
          'port-d12': { t: 'Sitio para practicante holística con terapia de duelo, ceremonias sagradas y retiros del alma.' },
          'port-c13': { t: 'Salud Mental · Psicoterapia Online' },
          'port-d13': { t: 'Plataforma de psicoterapia en línea especializada en recuperación de adicciones y sanación emocional.' },
          'port-c14': { t: 'Agropecuario · Consultoría Avícola' },
          'port-d14': { t: 'Asesoría especializada en bioseguridad, sanidad animal y optimización de producción avícola.' },

          /* ── NOSOTROS */
          'nos-eyebrow': { t: 'Por qué Cero' },
          'nos-title': { h: 'Por qué Cero <span class="t-lime">y no otra agencia</span>' },
          'nos-desc': { h: 'Sé lo que es apostarle todo a un negocio propio y que nadie te encuentre. Soy <strong>Carlos Luque</strong>, fundador de Cero Studio: llevo más de 25 años haciendo que las páginas vendan — desde la radio por internet hasta el home del sitio del INEGI.<br><br>Aquí no hay ejecutivo de cuenta ni "déjame lo consulto": tú hablas conmigo, yo diseño y programo tu sitio, y lo entrego en la fecha que firmamos. El precio que ves es el que pagas y tu sitio nace listo para Google <strong>y para ChatGPT</strong>. No te vendo una página bonita — te entrego <strong>una herramienta que trabaja mientras tú descansas</strong>.' },
          'stat-l1': { t: 'Negocios atendidos en 25 años' },
          'stat-l2': { t: 'Años de experiencia' },
          'stat-l3': { t: 'Sitios lanzados' },
          'stat-l4': { t: 'Entrega en fecha, por escrito' },
          'nos-btn': { t: 'Iniciar Proyecto' },
          'nos-historia': { t: 'Con quién vas a trabajar →' },
          'nos-quote': { h: 'Un sitio web no es un gasto. Es el <span style="color:var(--lime);">vendedor</span> más <span style="color:var(--lime);">trabajador</span> que nunca te pide vacaciones.' },
          /* ── PROCESO */
          'proc-eyebrow': { t: 'Cómo Trabajamos' },
          'proc-headline': { h: 'Sin sorpresas,<br><span class="t-outline">sin rodeos.</span>' },
          'proc-t1': { t: 'Nos cuentas' }, 'proc-d1': { t: 'Llenas el formulario o agendas una llamada gratis. En menos de 24 horas recibes una propuesta clara: qué necesitas, cuánto cuesta y cuándo se entrega.' },
          'proc-t2': { t: 'Apruebas' }, 'proc-d2': { t: 'Precio cerrado y fecha de entrega por escrito. Si nos atrasamos, tu primer mes de mantenimiento corre por nuestra cuenta.' },
          'proc-t3': { t: 'Construimos' }, 'proc-d3': { t: 'Diseño, textos que venden, SEO y desarrollo. Revisas avances por WhatsApp y apruebas cada etapa; nosotros entregamos en tiempo y forma.' },
          'proc-t4': { t: 'Vendes' }, 'proc-d4': { t: 'Tu sitio sale al aire, te capacitamos para editarlo y te acompañamos después del lanzamiento. Si quieres que siga creciendo con SEO o mantenimiento, recibes reportes mensuales con lo que importa: visitas, leads y ventas.' },
          /* ── TESTIMONIOS (PLACEHOLDER — sustituir por reales) */
          'testi-eyebrow': { t: 'Testimonios' },
          'testi-title': { h: 'Lo que dicen<br>quienes ya <span class="t-lime">venden</span>' },
          'testi-q1': { t: 'No siempre teníamos las ideas claras, pero Carlos siempre aportó soluciones. Logramos triplicar el valor de nuestra inversión en ventas.' },
          'testi-n1': { t: 'Gustavo Carrillo' }, 'testi-r1': { t: 'Dueño · IMVEC.MX' },
          'testi-q2': { t: 'Excelente compromiso, profesionalismo y nivel de servicio de parte de Carlos. ¡Gracias por su valiosa colaboración!' },
          'testi-n2': { t: 'Ricardo Lora' }, 'testi-r2': { t: 'Seminuevos Coapa · CDMX' },
          'testi-q3': { t: 'Nuestro nuevo sitio web optimizó la captación de clientes y aumentó nuestras ventas un 40% en dos meses.' },
          'testi-n3': { t: 'Jesús Bernal' }, 'testi-r3': { t: 'Mainoflex · Soluciones antivibratorias' },
          'testi-c1': { t: 'Ver el caso IMVEC →' },
          'testi-c2': { t: 'Ver el caso Seminuevos Coapa →' },
          'testi-c3': { t: 'Ver el caso Mainoflex →' },
          /* ── PRECIOS */
          'precios-eyebrow': { t: 'Inversión' },
          'precios-headline': { h: 'Precios<br><em>sin letra chica.</em>' },
          'precios-urgency': { t: 'Precio de portafolio · 5 lugares al mes' },
          'precios-trust-text': { h: 'Pago único. Sin sorpresas al final.<br>Fecha de entrega por escrito: si nos atrasamos, <strong>tu primer mes de mantenimiento corre por nuestra cuenta</strong>.' },
          'res-l1': { t: 'retorno de su inversión en ventas' },
          'res-c1': { t: 'IMVEC · ver caso →' },
          'res-l2': { t: 'más ventas en 2 meses' },
          'res-c2': { t: 'Mainoflex · ver caso →' },
          'res-l3': { t: 'proyectos entregados' },
          'res-c3': { t: 'Ver todos los casos →' },
          'dominate-headline': { h: '¿Listo<br>para<br>dominar?' },
          'dominate-sub': { h: 'Primera consulta gratis.<br>Fecha de entrega por escrito.' },
          'dominate-cta': { t: 'Iniciar Proyecto' },
          'dominate-audit': { t: '¿Todavía no estás listo? Pide la auditoría gratis de tu sitio →' },
          'launch-old-price': { h: '<span>Precio regular</span> <s>$499 USD</s>' },
          'launch-saving': { t: 'Ahorras $200 USD · precio de portafolio' },
          'launch-delivery': { t: 'pago único · entrega 5 días hábiles' },
          'launch-features': { h: '<li><strong>Identidad visual básica incluida</strong> — logo, paleta, tipografía</li><li>Una página de alto impacto con 4 secciones (hero, servicios, sobre ti, contacto)</li><li>Diseño responsive — celular y computadora</li><li>SEO básico configurado desde el inicio</li><li>Formulario de contacto incluido</li><li>Dominio <strong>.com</strong> incluido el primer año (o conectamos el tuyo si ya lo tienes)</li><li>Cambios de contenido a través de Cero Studio</li>' },
          'launch-note': { t: 'Ideal para: restaurantes, consultorios, salones, servicios locales.' },
          'launch-after': { h: 'Después del lanzamiento: mantenimiento opcional desde $800 MXN/mes, sin contrato anual → <a href="/servicios/mantenimiento/" data-href-es="/servicios/mantenimiento/" data-href-en="/en/services/web-maintenance/">ver planes</a>' },
          'launch-cta': { t: 'Quiero empezar →' },
          'pro-badge': { t: 'Más solicitado' },
          'pro-old-price': { h: '<span>Precio regular</span> <s>$2,500 USD</s>' },
          'pro-saving': { t: 'Ahorras $1,501 USD · precio de portafolio' },
          'pro-delivery': { t: 'pago único · entrega 21 días hábiles' },
          'pro-features': { h: '<li><strong>Identidad profesional incluida</strong> — logo, paleta, tipografía + guidelines mini</li><li>4 a 6 páginas con diseño de nivel internacional</li><li>Tú editas el contenido — sin depender de nosotros</li><li>Blog incluido para posicionarte como experto</li><li>Animaciones y microinteracciones premium</li><li>SEO avanzado + Google Search Console</li><li>Google Analytics + Tag Manager configurados</li><li>Botón de WhatsApp integrado</li><li>Dominio <strong>.com</strong> incluido el primer año (o conectamos el tuyo si ya lo tienes)</li><li>Responsive — celular, tablet y escritorio</li><li>Formulario de contacto profesional</li>' },
          'pro-note': { t: 'Ideal para: negocios establecidos, profesionales independientes, empresas listas para crecer.' },
          'pro-after': { h: 'Después del lanzamiento: mantenimiento opcional desde $800 MXN/mes, sin contrato anual → <a href="/servicios/mantenimiento/" data-href-es="/servicios/mantenimiento/" data-href-en="/en/services/web-maintenance/">ver planes</a>' },
          'pro-cta': { t: 'Quiero el Cero Pro →' },
          'premium-price-display': { h: 'Desde $1,800<span>USD</span>' },
          'premium-old-price': { h: '<span>Precio regular</span> <s>desde $4,500 USD</s>' },
          'premium-saving': { t: 'Ahorras desde $2,700 USD · precio de portafolio' },
          'premium-delivery': { t: 'cotización personalizada · entrega a convenir' },
          'premium-features': { h: '<li>Todo lo del plan Cero Pro</li><li><strong>Identidad integral + guidelines completos</strong></li><li>Funciones avanzadas a la medida</li><li>Estrategia digital incluida</li><li>Seguimiento prioritario y directo con Carlos</li>' },
          'premium-note': { t: 'Ideal para: negocios con múltiples servicios y necesidades a la medida.' },
          'premium-excludes': { t: 'No incluye tienda en línea: si vendes productos, mira los planes de tienda ↓' },
          'premium-after': { h: 'Después del lanzamiento: mantenimiento opcional desde $800 MXN/mes, sin contrato anual → <a href="/servicios/mantenimiento/" data-href-es="/servicios/mantenimiento/" data-href-en="/en/services/web-maintenance/">ver planes</a>' },
          'premium-cta': { t: 'Pedir cotización →' },
          'precios-condition': { h: '¿Por qué cuesta menos? Porque cada mes tomamos solo 5 proyectos a precio de portafolio: tú pagas menos y Cero Studio publica tu caso con el nombre de tu negocio y resultados reales. Cuando se llenan los 5 lugares, el siguiente proyecto entra al precio regular.<br> <span style="color:rgba(255,255,255,.45);" id="precios-currency-note">* Aceptamos pago en USD o MXN.</span>' },
          /* ── TIENDAS EN LÍNEA */
          'tiendas-eyebrow': { t: 'Tiendas en línea' },
          'tiendas-headline': { h: 'Vende<br><em>en línea.</em>' },
          'tiendas-urgency': { t: 'Tu tienda lista para cobrar, no solo para verse bien' },
          'tiendas-trust-text': { h: 'Pago único por el desarrollo.<br>La plataforma y la pasarela las cubre tu negocio.' },
          'tiendas-partner-caption': { h: 'Agencia <strong style="font-weight:600;color:#fff;">Tiendanube Partner</strong> certificada<br>Montamos tu tienda en línea en México' },
          'tienda-esencial-name': { t: 'Tienda Esencial' },
          'tienda-esencial-delivery': { t: 'pago único · marcas que empiezan' },
          'tienda-esencial-features': { h: '<li>Tienda en TiendaNube con template configurado a tu marca</li><li>Administras tu catálogo desde un panel simple — productos, precios y stock, cuando quieras</li><li>Pasarela de pago + envíos configurados</li><li>Conexión a Instagram + botón de WhatsApp</li><li>Dominio incluido (primer año)</li>' },
          'tienda-esencial-note': { t: 'Ideal para: empiezas a vender en línea, pocos productos y una sola categoría; tú subes el catálogo.' },
          'tienda-esencial-cta': { t: 'Quiero empezar →' },
          'tienda-pro-badge': { t: 'Más solicitado' },
          'tienda-pro-name': { t: 'Tienda Pro' },
          'tienda-pro-delivery': { t: 'pago único · catálogo en crecimiento' },
          'tienda-pro-features': { h: '<li>Todo lo de Tienda Esencial</li><li>Diseño alineado a tu marca</li><li>SEO básico + categorías organizadas</li><li>Integraciones (Instagram Shopping)</li>' },
          'tienda-pro-note': { t: 'Ideal para: ya vendes por Instagram o WhatsApp y te quedas corto; varias categorías y quieres que Google te encuentre.' },
          'tienda-pro-cta': { t: 'Quiero la Tienda Pro →' },
          'tienda-premium-name': { t: 'Tienda Premium' },
          'tienda-premium-delivery': { t: 'pago único · marca establecida' },
          'tienda-premium-features': { h: '<li>Todo lo de Tienda Pro</li><li>Diseño 100% personalizado</li><li>Branding completo</li><li>SEO avanzado + automatizaciones (carrito abandonado, correos)</li>' },
          'tienda-premium-note': { t: 'Ideal para: marca con volumen que quiere diseño propio, identidad completa y automatizaciones que recuperan carritos.' },
          'tienda-premium-cta': { t: 'Quiero la Premium →' },
          'tiendas-custom': { h: '¿Operación grande? Catálogo extenso, ERP, multi-bodega o venta B2B → eCommerce a la medida, cotizado por alcance. <a href="/servicios/tiendas-ecommerce/" data-href-es="/servicios/tiendas-ecommerce/" data-href-en="/en/services/online-stores/">Ver cómo trabajamos →</a>' },
          'tiendas-condition': { t: 'Mensualidad opcional de soporte y carga de producto desde $800 MXN/mes. El plan de TiendaNube (~$99–249/mes) y la comisión de la pasarela de pago (~3.8% + IVA por venta) los cubre el cliente.' },
          /* ── STAKES */
          'stakes-eyebrow': { t: 'Lo que está en juego' },
          'stakes-title': { h: 'Lo que pierdes cada día<br>sin un sitio <span class="t-lime">que venda</span>' },
          'stakes-1t': { t: 'El cliente que te buscó anoche' },
          'stakes-1p': { t: 'Te buscó en Google, no te encontró — o encontró un sitio que no daba confianza — y le compró al competidor que sí aparece. Eso pasa todos los días, en silencio.' },
          'stakes-2t': { t: 'La credibilidad que ya te juzgaron' },
          'stakes-2p': { t: 'El 75% de las personas juzga la seriedad de una empresa por su sitio web. Con un sitio viejo o sin sitio, ya te descartaron antes de hablar contigo.' },
          'stakes-3t': { t: 'Las respuestas de IA donde no existes' },
          'stakes-3p': { t: 'Cerca del 30% de las búsquedas ya terminan en ChatGPT, Gemini o Perplexity. Si tu negocio no está en sus fuentes, la IA recomienda a otro.' },
          'stakes-cta': { t: 'Deja de perder clientes →' },
          'stakes-cta-audit': { t: '¿Ya tienes sitio? Pide tu auditoría gratis: 5 hallazgos en 48 h →' },
          /* ── FAQ */
          'faq-eyebrow': { t: 'Preguntas frecuentes' },
          'faq-title': { h: 'Lo que todos preguntan<br>antes de <span class="t-lime">empezar</span>' },
          'faq-q1': { t: '¿Cuánto cuesta una página web profesional?' },
          'faq-a1': { t: 'Tres planes de pago único: Cero Launch $299 USD (≈ $5,400 MXN) con entrega en 5 días hábiles, Cero Pro $999 USD (≈ $17,900 MXN) — el más solicitado — y Cero Premium desde $1,800 USD (≈ $32,000 MXN). Sin mensualidades ocultas: el precio que ves es el precio que pagas. Si quieres que cuidemos el sitio después del lanzamiento, el mantenimiento es opcional desde $800 MXN al mes, sin contrato anual.' },
          'faq-q2': { t: '¿En cuánto tiempo está listo mi sitio?' },
          'faq-a2': { t: 'Entre 5 y 21 días hábiles según el plan. Conoces tu fecha de entrega desde el día uno y va garantizada por escrito: si nos atrasamos, tu mantenimiento corre por nuestra cuenta durante 1 mes.' },
          'faq-q3': { t: '¿Qué incluye mi sitio para vender y no solo verse bien?' },
          'faq-a3': { t: 'Diseño a la medida (cero plantillas genéricas), SEO configurado desde el inicio, diseño responsive, formulario de contacto y contenido escrito para convertir visitas en clientes. Tu sitio trabaja por ti las 24 horas.' },
          'faq-q4': { t: '¿Qué es la optimización para IA (AEO/GEO)?' },
          'faq-a4': { t: 'Cerca del 30% de las búsquedas ya terminan en una respuesta de ChatGPT, Gemini o Perplexity en vez de un clic. Optimizamos tu sitio (schema, llms.txt, contenido citable) para que la IA te recomiende a ti. Si no apareces en sus fuentes, ese cliente nunca sabrá que existes.' },
          'faq-q5': { t: '¿Trabajan con negocios fuera de la Ciudad de México?' },
          'faq-a5': { t: 'Sí — atendemos a emprendedores y negocios de todo México, 100% remoto: reuniones por videollamada, avances por WhatsApp y comunicación directa con Carlos, sin intermediarios.' },
          'faq-q6': { t: '¿Cómo empiezo mi proyecto?' },
          'faq-a6': { t: 'Manda el formulario de contacto o agenda una llamada gratis. Recibes respuesta en menos de 24 horas con una propuesta clara, y tu sitio se lanza en la fecha acordada. ¿Todavía no estás listo? Pide primero la auditoría gratis de tu sitio: 5 hallazgos en 48 horas, sin llamadas de venta.' },
          'faq-q7': { t: '¿Y si mejor lo hago yo en Wix o con una plantilla?' },
          'faq-a7': { t: 'Puedes — y para probar una idea está bien. El problema llega cuando tu negocio ya es serio y el sitio no: una plantilla que se ve igual a otras mil, carga lenta, SEO a medias y cero presencia en ChatGPT. Aquí el diseño se hace a la medida de cómo compra tu cliente, el precio es cerrado y hablas directo con quien lo construye. El Cero Launch sale en 5 días hábiles por $299 USD (≈ $5,400 MXN), pago único, y el sitio es tuyo.' },
          /* ── CONTACTO */
          'contact-eyebrow': { t: 'Contacto' },
          'contact-title': { h: 'Cuéntanos de tu negocio.<br>En 24 h tienes <span class="t-outline">propuesta</span>.' },
          'contact-sub': { t: 'Sin cotizaciones eternas: nos dices qué vendes y a quién, y te regresamos un plan claro con precio cerrado y fecha de entrega por escrito. La primera consulta es gratis.' },
          'contact-p1n': { t: '≤ 24 h' },
          'contact-p1': { t: 'Te respondemos' },
          'contact-p2n': { t: 'Por escrito' },
          'contact-p2': { t: 'Fecha de entrega garantizada' },
          'contact-p3n': { t: '150+' },
          'contact-p3': { t: 'Negocios en 25 años' },
          'contact-quote': { t: '«Excelente compromiso, profesionalismo y nivel de servicio de parte de Carlos.»' },
          'contact-quote-cite': { t: 'Ricardo Lora · Seminuevos Coapa · ver caso →' },
          'submitBtnLabel': { t: 'Quiero mi propuesta →' },
          'form-reassure': { t: 'Respuesta en menos de 24 h · Sin compromiso · Hablas directo con Carlos' },
          'agenda-link': { t: 'O agenda una llamada gratis →' },
          'contact-wa': { t: 'Mejor por WhatsApp →' },
          /* ── FOOTER */
          'footer-tagline': { t: 'Diseñamos el futuro digital de tu negocio.' },
          'footer-partner-text': { h: 'Agencia <strong style="font-weight:600;color:#fff;">Tiendanube Partner</strong> certificada' },
          'fcol-nav-title': { t: 'Navegación' },
          'fcol-srv-title': { t: 'Servicios' },
          'fcol-contact-title': { t: 'Contacto' },
          'fnav-srv': { t: 'Servicios' }, 'fnav-port': { t: 'Portafolio' },
          'fnav-nos': { t: 'Nosotros' }, 'fnav-proc': { t: 'Proceso' },
          'fnav-contact': { t: 'Contacto' }, 'fnav-privacy': { t: 'Privacidad y Cookies' },
          'fsrv-1': { t: 'Desarrollo Web' }, 'fsrv-2': { t: 'Tiendas eCommerce' },
          'fsrv-3': { t: 'Branding Digital' }, 'fsrv-4': { t: 'SEO + AI Search' },
          'fsrv-5': { t: 'Mantenimiento' },
          'footer-copy': { t: '© 2026 Cero Studio. Todos los derechos reservados.' },
          'footer-credit': { h: 'Hecho con <span>♥</span> para emprendedores' },
          'cs-bar-msg': { t: 'Usamos cookies propias y de terceros (Google Analytics y Meta Pixel) para analizar el tráfico, medir campañas y mejorar tu experiencia.' },
          'cs-bar-link': { t: 'Política de cookies' },
          'cs-bar-reject': { t: 'Solo esenciales' },
          'cs-bar-accept': { t: 'Aceptar todo' },
        },
        en: {
          /* ── LOADER */
          'ldLbl': { t: 'Loading' },
          /* ── NAV */
          'nav-servicios': { t: 'Services' },
          'nav-portafolio': { t: 'Portfolio' },
          'nav-nosotros': { t: 'About' },
          'nav-precios': { t: 'Pricing' },
          'nav-contacto': { t: 'Contact' },
          'nav-cta': { t: 'Start Your Project' },
          'mnav-servicios': { t: 'Services' },
          'mnav-portafolio': { t: 'Portfolio' },
          'mnav-nosotros': { t: 'About' },
          'mnav-precios': { t: 'Pricing' },
          'mnav-contacto': { t: 'Contact' },
          /* plan 2026-09: chrome site-wide (partials de WS-E) */
          'mnav-cta': { t: 'Start Your Project' },
          'mnav-wa': { t: 'WhatsApp us directly' },
          'mob-bar-main': { t: 'Get a quote' },
          /* ── HERO */
          'heroEyebrow': { t: 'Customers, not just clicks.' },
          'heroSub': { t: 'Your business is already good. What\'s missing is a website that proves it and turns the people looking for you into customers — built for you, from $299 USD, live in 5 business days.' },
          'hero-btn-audit': { t: 'Free audit of my site →' },
          'hero-btn-quote': { t: 'Start Your Project' },
          'heroProof': { h: '25+ years of craft · You talk directly with Carlos · Delivery date in writing · Certified Tiendanube Partner Agency — <a href="/en/case-studies/" data-href-es="/casos-de-exito/" data-href-en="/en/case-studies/">See case studies →</a>' },
          /* ── MARQUEE */
          'marquee-1': { h: 'Web Design <em>·</em> eCommerce <em>·</em> Branding <em>·</em> SEO <em>·</em> Development <em>·</em> Consulting <em>·</em> Maintenance <em>·</em> Visual Identity <em>·</em>' },
          'marquee-2': { h: 'Web Design <em>·</em> eCommerce <em>·</em> Branding <em>·</em> SEO <em>·</em> Development <em>·</em> Consulting <em>·</em> Maintenance <em>·</em> Visual Identity <em>·</em>' },
          'ticker-label': { t: 'Brands Carlos has worked with' },
          /* ── SERVICIOS */
          'srv-eyebrow': { t: '01 — Services' },
          'srv-title': { h: 'Everything you need<br>to <span class="t-outline">sell</span> online' },
          'srv-desc': { t: 'Pick only what your business needs today. Every service is built for the same thing: getting you found, trusted and bought from.' },
          'srv-t1': { t: 'Web Development' }, 'srv-d1': { t: 'Fast, modern, optimized websites that build trust and convert visitors into customers from the first click.' },
          'srv-t2': { t: 'eCommerce Stores' }, 'srv-d2': { t: 'Your business open 24/7. Complete online stores with payment gateways, inventory, and seamless shopping experience.' },
          'srv-t3': { t: 'Digital Branding' }, 'srv-d3': { t: 'Professional visual identity that sets your brand apart and builds the trust your audience needs to see.' },
          'srv-t4': { t: 'SEO + AI Search' }, 'srv-d4': { t: 'Google rankings + visibility in ChatGPT, Claude, Gemini and Perplexity. So your customers find you — searching or asking.' },
          'srv-t5': { t: 'Maintenance' }, 'srv-d5': { t: 'Continuous technical support, security updates, and optimization so your site runs perfectly at all times.' },
          'srv-t6': { t: 'Digital Consulting' }, 'srv-d6': { t: 'Personalized digital strategy to scale your business. We make the right decisions before writing a single line of code.' },
          'srv-l1': { t: 'See details →' },
          'srv-l2': { t: 'See details →' },
          'srv-l3': { t: 'See details →' },
          'srv-l4': { t: 'See details →' },
          'srv-l5': { t: 'See details →' },
          'srv-l6': { t: 'See details →' },
          /* ── PORTAFOLIO */
          'port-title': { h: 'Projects that make<br>a <span class="t-outline">difference</span>' },
          'port-start-btn': { t: 'Start Your Project' },
          'port-cta-q': { h: 'Your business<br>here?' },
          'port-cta-sub': { t: 'Your case could be next: 3× return at IMVEC, +40% at Mainoflex' },
          'port-cta-btn': { t: 'Start Your Project' },
          'port-more': { t: 'See all projects →' }, /* plan 2026-09: A2 sustituye por «See all N projects →» con el conteo real */
          'plan-more': { t: 'See everything included' }, /* plan 2026-09: pricing móvil; JS concatena (+N) */
          'plan-less': { t: 'Show less' },
          'port-badge': { t: 'View Project →' },
          'port-c1': { t: 'Agency · Models & BTL Production' },
          'port-d1': { t: 'Digital platform for modeling agency, promotional staff and corporate event production.' },
          'port-c2': { t: 'Print Shop · Online Quoting' },
          'port-d2': { t: 'Corporate site for offset printing with integrated product quoter.' },
          'port-c3': { t: 'Automotive · Online Inventory' },
          'port-d3': { t: 'Digital vehicle catalog with advanced search and detailed technical specs.' },
          'port-c4': { t: 'Agency · Talent & BTL Activations' },
          'port-d4': { t: 'Site for professional talent agency with BTL activations and event infrastructure.' },
          'port-c5': { t: 'Industrial · Anti-vibration Solutions' },
          'port-d5': { t: 'Catalog and online store for industrial maintenance products distributor.' },
          'port-c6': { t: 'Manufacturing · Racks & Displays' },
          'port-d6': { t: 'Multi-brand store with real-time inventory system and dynamic catalog.' },
          'port-c7': { t: 'Online Store · Pets' },
          'port-d7': { t: 'High-quality online store for pet care and well-being.' },
          'port-c8': { t: 'Education · Digital Enrollment' },
          'port-d8': { t: 'Institutional portal for research center with advanced editorial management.' },
          'port-c9': { t: 'Industrial · Metal Fabrication' },
          'port-d9': { t: 'Business portal with institutional presentation and active project management.' },
          'port-c10': { t: 'Online Store · Cats' },
          'port-d10': { t: 'Specialized e-commerce for premium cat products and accessories.' },
          'port-c11': { t: 'Health · Pulmonology' },
          'port-d11': { t: 'Respiratory health platform with educational resources and online consultations.' },
          'port-c12': { t: 'Wellness · Holistic Healing' },
          'port-d12': { t: 'Website for a holistic practitioner offering grief therapy, sacred ceremonies, and soul retreats.' },
          'port-c13': { t: 'Mental Health · Online Psychotherapy' },
          'port-d13': { t: 'Online psychotherapy platform specialized in addiction recovery and emotional healing.' },
          'port-c14': { t: 'Agriculture · Poultry Consulting' },
          'port-d14': { t: 'Specialized advisory in biosecurity, animal health, and poultry production optimization.' },

          /* ── NOSOTROS */
          'nos-eyebrow': { t: 'Why Cero' },
          'nos-title': { h: 'Why Cero <span class="t-lime">and not another agency</span>' },
          'nos-desc': { h: 'I know what it\'s like to bet everything on your own business and have nobody find you. I\'m <strong>Carlos Luque</strong>, founder of Cero Studio: I\'ve spent more than 25 years making websites sell — from internet radio to the homepage of Mexico\'s national statistics institute (INEGI).<br><br>There\'s no account manager here and no "let me check with the team": you talk to me, I design and build your site, and I deliver it on the date we sign. The price you see is the price you pay, and your site is born ready for Google <strong>and for ChatGPT</strong>. I\'m not selling you a pretty page — I\'m handing you <strong>a tool that works while you rest</strong>.' },
          'stat-l1': { t: 'Businesses served in 25 years' },
          'stat-l2': { t: 'Years of experience' },
          'stat-l3': { t: 'Sites launched' },
          'stat-l4': { t: 'On-time delivery, in writing' },
          'nos-btn': { t: 'Start Your Project' },
          'nos-historia': { t: "Who you'll work with →" },
          'nos-quote': { h: "A website isn't an expense. It's the <span style=\"color:var(--lime);\">hardest-working</span> <span style=\"color:var(--lime);\">employee</span> you'll never have to pay overtime." },
          /* ── PROCESO */
          'proc-eyebrow': { t: 'How We Work' },
          'proc-headline': { h: 'No surprises,<br><span class="t-outline">no detours.</span>' },
          'proc-t1': { t: 'You tell us' }, 'proc-d1': { t: 'Fill in the form or book a free call. Within 24 hours you get a clear proposal: what you need, what it costs and when it ships.' },
          'proc-t2': { t: 'You approve' }, 'proc-d2': { t: 'Fixed price and a delivery date in writing. If we run late, your first month of maintenance is on us.' },
          'proc-t3': { t: 'We build' }, 'proc-d3': { t: 'Design, copy that sells, SEO and development. You review progress over WhatsApp and sign off on each stage; we deliver on time.' },
          'proc-t4': { t: 'You sell' }, 'proc-d4': { t: 'Your site goes live, we train you to edit it and we stay with you after launch. If you want it to keep growing with SEO or maintenance, you get monthly reports on what matters: visits, leads and sales.' },
          /* ── TESTIMONIOS (PLACEHOLDER — replace with real ones) */
          'testi-eyebrow': { t: 'Testimonials' },
          'testi-title': { h: 'What businesses<br>already <span class="t-lime">selling</span> say' },
          'testi-q1': { t: 'We didn\'t always have our ideas fully clear, but Carlos always brought solutions to the table. We ended up tripling the value of our investment in sales.' },
          'testi-n1': { t: 'Gustavo Carrillo' }, 'testi-r1': { t: 'Owner · IMVEC.MX' },
          'testi-q2': { t: 'Excellent commitment, professionalism and level of service from Carlos. Thank you for your valuable collaboration!' },
          'testi-n2': { t: 'Ricardo Lora' }, 'testi-r2': { t: 'Seminuevos Coapa · Mexico City' },
          'testi-q3': { t: 'Our new website optimized how we bring in clients and grew our sales by 40% in two months.' },
          'testi-n3': { t: 'Jesús Bernal' }, 'testi-r3': { t: 'Mainoflex · Anti-vibration solutions' },
          'testi-c1': { t: 'See the IMVEC case →' },
          'testi-c2': { t: 'See the Seminuevos Coapa case →' },
          'testi-c3': { t: 'See the Mainoflex case →' },
          /* ── PRECIOS */
          'precios-eyebrow': { t: 'Investment' },
          'precios-headline': { h: 'Pricing<br><em>no hidden fees.</em>' },
          'precios-urgency': { t: 'Portfolio pricing · 5 spots a month' },
          'precios-trust-text': { h: 'One-time payment. No surprises at the end.<br>Delivery date in writing: if we run late, <strong>your first month of maintenance is on us</strong>.' },
          'res-l1': { t: 'return on their sales investment' },
          'res-c1': { t: 'IMVEC · view case →' },
          'res-l2': { t: 'more sales in 2 months' },
          'res-c2': { t: 'Mainoflex · view case →' },
          'res-l3': { t: 'projects delivered' },
          'res-c3': { t: 'View all case studies →' },
          'dominate-headline': { h: 'Ready<br>to<br>dominate?' },
          'dominate-sub': { h: 'Free first consultation.<br>Delivery date in writing.' },
          'dominate-cta': { t: 'Start Your Project' },
          'dominate-audit': { t: 'Not ready yet? Get the free audit of your site first →' },
          'launch-old-price': { h: '<span>Regular price</span> <s>$499 USD</s>' },
          'launch-saving': { t: 'You save $200 USD · portfolio pricing' },
          'launch-delivery': { t: 'one-time payment · delivered in 5 business days' },
          'launch-features': { h: '<li><strong>Basic visual identity included</strong> — logo, palette, typography</li><li>A high-impact one-page site with 4 sections (hero, services, about, contact)</li><li>Responsive design — phone and desktop</li><li>Basic SEO configured from day one</li><li>Contact form included</li><li><strong>.com</strong> domain included the first year (or we connect yours if you already have one)</li><li>Content updates handled by Cero Studio</li>' },
          'launch-note': { t: 'Best for: restaurants, clinics, salons, local service businesses.' },
          'launch-after': { h: 'After launch: optional maintenance from $800 MXN/mo, no annual contract → <a href="/en/services/web-maintenance/" data-href-es="/servicios/mantenimiento/" data-href-en="/en/services/web-maintenance/">see plans</a>' },
          'launch-cta': { t: 'Get started →' },
          'pro-badge': { t: 'Most popular' },
          'pro-old-price': { h: '<span>Regular price</span> <s>$2,500 USD</s>' },
          'pro-saving': { t: 'You save $1,501 USD · portfolio pricing' },
          'pro-delivery': { t: 'one-time payment · delivered in 21 business days' },
          'pro-features': { h: '<li><strong>Professional identity included</strong> — logo, palette, typography + mini guidelines</li><li>4 to 6 pages, designed from scratch around your brand</li><li>You edit your content — no waiting on us</li><li>Blog included to position you as an expert</li><li>Premium animations and microinteractions</li><li>Advanced SEO + Google Search Console</li><li>Google Analytics + Tag Manager setup</li><li>WhatsApp button integrated</li><li><strong>.com</strong> domain included the first year (or we connect yours if you already have one)</li><li>Responsive — phone, tablet, and desktop</li><li>Professional contact form</li>' },
          'pro-note': { t: 'Best for: established businesses, independent professionals, companies ready to grow.' },
          'pro-after': { h: 'After launch: optional maintenance from $800 MXN/mo, no annual contract → <a href="/en/services/web-maintenance/" data-href-es="/servicios/mantenimiento/" data-href-en="/en/services/web-maintenance/">see plans</a>' },
          'pro-cta': { t: 'Get Cero Pro →' },
          'premium-price-display': { h: 'From $1,800<span>USD</span>' },
          'premium-old-price': { h: '<span>Regular price</span> <s>from $4,500 USD</s>' },
          'premium-saving': { t: 'You save from $2,700 USD · portfolio pricing' },
          'premium-delivery': { t: 'custom quote · timeline agreed up front' },
          'premium-features': { h: '<li>Everything in Cero Pro</li><li><strong>Full identity + complete guidelines</strong></li><li>Custom advanced features</li><li>Digital strategy included</li><li>Priority, direct follow-up with Carlos</li>' },
          'premium-note': { t: 'Best for: businesses with multiple services and custom needs.' },
          'premium-excludes': { t: 'Does not include an online store: if you sell products, see the store plans ↓' },
          'premium-after': { h: 'After launch: optional maintenance from $800 MXN/mo, no annual contract → <a href="/en/services/web-maintenance/" data-href-es="/servicios/mantenimiento/" data-href-en="/en/services/web-maintenance/">see plans</a>' },
          'premium-cta': { t: 'Request a quote →' },
          'precios-condition': { h: 'Why does it cost less? Because each month we take on only 5 projects at portfolio pricing: you pay less, and Cero Studio publishes your case with your business name and real results. Once the 5 spots are filled, the next project comes in at the regular price.<br><span style="color:rgba(255,255,255,.45);" id="precios-currency-note">* We accept payment in USD or MXN.</span>' },
          /* ── TIENDAS EN LÍNEA */
          'tiendas-eyebrow': { t: 'Online stores' },
          'tiendas-headline': { h: 'Sell<br><em>online.</em>' },
          'tiendas-urgency': { t: 'A store built to sell, not just to look good' },
          'tiendas-trust-text': { h: 'One-time payment for the build, billed in Mexican pesos (we also take USD).<br>The Tiendanube plan and payment gateway are paid by your business.' },
          'tiendas-partner-caption': { h: 'Certified <strong style="font-weight:600;color:#fff;">Tiendanube Partner</strong> Agency<br>We build your online store in Mexico' },
          'tienda-esencial-name': { t: 'Store Essentials' },
          'tienda-esencial-delivery': { t: 'one-time payment · brands just starting out' },
          'tienda-esencial-features': { h: '<li>TiendaNube store with a template configured to your brand</li><li>Manage your catalog from a simple panel — products, prices and stock, anytime</li><li>Payment gateway + shipping configured</li><li>Instagram connection + WhatsApp button</li><li>Domain included (first year)</li>' },
          'tienda-esencial-note': { t: 'Best for: you\'re starting to sell online, a few products in one category; you upload the catalog.' },
          'tienda-esencial-cta': { t: 'Start my store →' },
          'tienda-pro-badge': { t: 'Most popular' },
          'tienda-pro-name': { t: 'Store Pro' },
          'tienda-pro-delivery': { t: 'one-time payment · growing catalog' },
          'tienda-pro-features': { h: '<li>Everything in Store Essentials</li><li>Design aligned with your brand</li><li>Basic SEO + organized categories</li><li>Integrations (Instagram Shopping)</li>' },
          'tienda-pro-note': { t: 'Best for: you already sell on Instagram or WhatsApp and it\'s not enough; several categories and you want Google to find you.' },
          'tienda-pro-cta': { t: 'Get Store Pro →' },
          'tienda-premium-name': { t: 'Store Premium' },
          'tienda-premium-delivery': { t: 'one-time payment · established brand' },
          'tienda-premium-features': { h: '<li>Everything in Store Pro</li><li>100% custom design</li><li>Full branding</li><li>Advanced SEO + automations (abandoned cart, emails)</li>' },
          'tienda-premium-note': { t: 'Best for: a brand with volume that wants its own design, full identity and automations that recover abandoned carts.' },
          'tienda-premium-cta': { t: 'Get Store Premium →' },
          'tiendas-custom': { h: 'Running a larger operation? Large catalog, ERP, multi-warehouse or B2B → custom eCommerce, quoted by scope. <a href="/en/services/online-stores/" data-href-es="/servicios/tiendas-ecommerce/" data-href-en="/en/services/online-stores/">See how we work →</a>' },
          'tiendas-condition': { t: 'Optional support and product-upload retainer from $800 MXN/month. The TiendaNube plan (~$99–249/month) and the payment gateway fee (~3.8% + tax per sale) are covered by the client.' },
          /* ── STAKES */
          'stakes-eyebrow': { t: "What's at stake" },
          'stakes-title': { h: 'What you lose every day<br>without a site <span class="t-lime">that sells</span>' },
          'stakes-1t': { t: 'The customer who searched for you last night' },
          'stakes-1p': { t: "They looked for you on Google, didn't find you — or found a site that inspired no trust — and bought from the competitor who does show up. It happens every day, silently." },
          'stakes-2t': { t: 'The credibility you were already judged on' },
          'stakes-2p': { t: '75% of people judge how serious a business is by its website. With an outdated site — or none — you were ruled out before the first conversation.' },
          'stakes-3t': { t: "The AI answers where you don't exist" },
          'stakes-3p': { t: "About 30% of searches now end in ChatGPT, Gemini or Perplexity. If your business isn't in their sources, the AI recommends someone else." },
          'stakes-cta': { t: 'Stop losing customers →' },
          'stakes-cta-audit': { t: 'Already have a site? Get a free audit: 5 findings in 48 hours →' },
          /* ── FAQ */
          'faq-eyebrow': { t: 'FAQ' },
          'faq-title': { h: 'The questions everyone asks<br>before <span class="t-lime">getting started</span>' },
          'faq-q1': { t: 'How much does a professional website cost?' },
          'faq-a1': { t: 'Three one-time-payment plans: Cero Launch at $299 USD delivered in 5 business days, Cero Pro at $999 USD — our most requested — and Cero Premium from $1,800 USD. No hidden monthly fees: the price you see is the price you pay. If you\'d like us to look after the site after launch, maintenance is optional from $800 MXN a month, no annual contract.' },
          'faq-q2': { t: 'How long until my site is ready?' },
          'faq-a2': { t: 'Between 5 and 21 business days depending on the plan. You know your delivery date from day one and it\'s guaranteed in writing: if we run late, your maintenance is on us for 1 month.' },
          'faq-q3': { t: 'What does my site include so it sells, not just looks good?' },
          'faq-a3': { t: 'Custom design (zero generic templates), SEO configured from the start, responsive design, a contact form and copy written to turn visitors into customers. Your site works for you 24/7.' },
          'faq-q4': { t: 'What is AI search optimization (AEO/GEO)?' },
          'faq-a4': { t: 'About 30% of searches now end in an answer from ChatGPT, Gemini or Perplexity instead of a click. We optimize your site (schema, llms.txt, quotable content) so AI recommends you. If you are not in its sources, that customer will never know you exist.' },
          'faq-q5': { t: 'Do you work with clients outside Mexico?' },
          'faq-a5': { t: 'Yes. Everything is 100% remote — video calls, updates over WhatsApp and a direct line to Carlos in English, no middlemen. Most of our clients run businesses in Mexico; if you\'re an English-speaking owner based here, or a company that wants to sell to Mexican customers, you get a team that already knows how people here search, trust and pay. We invoice in USD or MXN.' },
          'faq-q6': { t: 'How do I start my project?' },
          'faq-a6': { t: 'Send the contact form or book a free call. You\'ll hear back within 24 hours with a clear proposal, and your site launches on the agreed date. Not ready yet? Start with a free audit of your site: 5 findings in 48 hours, no sales calls.' },
          'faq-q7': { t: 'What if I just build it myself on Wix or with a template?' },
          'faq-a7': { t: 'You can — and to test an idea, that\'s fine. The trouble starts when your business gets serious and your site doesn\'t: a template that looks like a thousand others, slow loading, half-done SEO and zero presence in ChatGPT. Here the design is built around how your customer buys, the price is fixed, and you talk directly to the person building it. Cero Launch ships in 5 business days for $299 USD, one-time payment, and the site is yours.' },
          /* ── CONTACTO */
          'contact-eyebrow': { t: 'Contact' },
          'contact-title': { h: 'Tell us about your business.<br>Proposal within <span class="t-outline">24 hours</span>.' },
          'contact-sub': { t: 'No endless quoting: tell us what you sell and to whom, and we send back a clear plan with a fixed price and a delivery date in writing. The first consultation is free.' },
          'contact-p1n': { t: '≤ 24 h' },
          'contact-p1': { t: 'We reply' },
          'contact-p2n': { t: 'In writing' },
          'contact-p2': { t: 'Guaranteed delivery date' },
          'contact-p3n': { t: '150+' },
          'contact-p3': { t: 'Businesses in 25 years' },
          'contact-quote': { t: '“Outstanding commitment, professionalism and level of service from Carlos.”' },
          'contact-quote-cite': { t: 'Ricardo Lora · Seminuevos Coapa · view case →' },
          'submitBtnLabel': { t: 'Send me my proposal →' },
          'form-reassure': { t: 'Reply within 24 hours · No strings attached · You talk directly with Carlos' },
          'agenda-link': { t: 'Or schedule a free call →' },
          'contact-wa': { t: 'Message us on WhatsApp' },
          /* ── FOOTER */
          'footer-tagline': { t: 'We design the digital future of your business.' },
          'footer-partner-text': { h: 'Certified <strong style="font-weight:600;color:#fff;">Tiendanube Partner</strong> Agency' },
          'fcol-nav-title': { t: 'Navigation' },
          'fcol-srv-title': { t: 'Services' },
          'fcol-contact-title': { t: 'Contact' },
          'fnav-srv': { t: 'Services' }, 'fnav-port': { t: 'Portfolio' },
          'fnav-nos': { t: 'About Us' }, 'fnav-proc': { t: 'Process' },
          'fnav-contact': { t: 'Contact' }, 'fnav-privacy': { t: 'Privacy & Cookies' },
          'fsrv-1': { t: 'Web Development' }, 'fsrv-2': { t: 'eCommerce Stores' },
          'fsrv-3': { t: 'Digital Branding' }, 'fsrv-4': { t: 'SEO + AI Search' },
          'fsrv-5': { t: 'Maintenance' },
          'footer-copy': { t: '© 2026 Cero Studio. All rights reserved.' },
          'footer-credit': { h: 'Made with <span>♥</span> for visionary businesses' },
          'cs-bar-msg': { t: 'We use first-party and third-party cookies (Google Analytics and Meta Pixel) to analyze traffic, measure campaigns and improve your experience.' },
          'cs-bar-link': { t: 'Cookie policy' },
          'cs-bar-reject': { t: 'Essential only' },
          'cs-bar-accept': { t: 'Accept all' },
        }
      };

      /* Hero scramble texts per language */
      var CS_HERO_TEXTS = {
        es: [
          { el: 'scrL1',  text: 'PRESENCIA', delay: 200 },
          { el: 'scrL2a', text: 'DIGITAL',   delay: 340 },
          { el: 'scrL2b', text: 'QUE',       delay: 520 },
          { el: 'scrL3',  text: 'VENDE.',    delay: 660 },
        ],
        en: [
          { el: 'scrL1',  text: 'DIGITAL',   delay: 200 },
          { el: 'scrL2a', text: 'PRESENCE',  delay: 340 },
          { el: 'scrL2b', text: 'THAT',      delay: 520 },
          { el: 'scrL3',  text: 'SELLS.',    delay: 660 },
        ]
      };

      /* Form placeholders + select options per language */
      var CS_FORM = {
        es: {
          nombre: 'Nombre *',
          email: 'Email *',
          whatsapp: 'WhatsApp (10 dígitos) *',
          whatsappPh: '55 1234 5678', /* plan 2026-09: placeholder por idioma (EN-04) */
          empresa: 'Empresa / Negocio',
          servicio: '¿Qué servicio necesitas?',
          servicioPh: 'Selecciona una opción',
          mensaje: '¿Qué vendes y qué quieres lograr con tu sitio? *',
          mensajePh: 'Ej. Tengo una estética en Coyoacán, hoy vendo por Instagram y quiero un sitio donde mis clientas agenden en línea. Me interesa el Cero Pro.', /* plan 2026-09: placeholder guía (A2 lo aplica en setLang) */
          tiene: '¿Ya tienes sitio web? *',
          tieneSi: 'Sí, ya tengo',
          tieneNo: 'Todavía no',
          sitio: 'El link de tu sitio web *',
          sitioPh: 'minegocio.mx',
          negocio: 'Nombre y dirección de tu negocio *',
          negocioPh: 'Tacos El Güero · Av. Coyoacán 309, CDMX',
          opts: ['Desarrollo Web', 'Tienda eCommerce', 'Branding Digital', 'SEO & Visibilidad', 'Mantenimiento', 'Consultoría Digital', 'Auditoría exprés gratis de mi sitio', 'Otro']
        },
        en: {
          nombre: 'Name *',
          email: 'Email *',
          whatsapp: 'WhatsApp / mobile (with country code) *', /* plan 2026-09: EN acepta 10–15 dígitos (EN-04) */
          whatsappPh: '+1 512 555 1234',
          empresa: 'Company / Business',
          servicio: 'What service do you need?',
          servicioPh: 'Select an option',
          mensaje: 'What do you sell, and what should your site achieve? *',
          mensajePh: 'E.g. I run a dental clinic in Mexico City, I get most clients from Instagram and I want a site where patients can book online. I\'m interested in Cero Pro.',
          tiene: 'Do you already have a website? *',
          tieneSi: 'Yes, I do',
          tieneNo: 'Not yet',
          sitio: 'Your website link *',
          sitioPh: 'mybusiness.com',
          negocio: 'Your business name and address *',
          negocioPh: "Joe's Tacos · 309 Coyoacán Ave, CDMX",
          opts: ['Web Development', 'eCommerce Store', 'Digital Branding', 'SEO & Visibility', 'Maintenance', 'Digital Consulting', 'Free express audit of my site', 'Other']
        }
      };

      function setLang(lang) {
        CS_LANG = lang;
        var dict = CS_I18N[lang];
        var g = function (id) { return document.getElementById(id); };

        /* Apply all text/html translations (id + data-i18n for hero duplicates) */
        Object.keys(dict).forEach(function (id) {
          var val = dict[id];
          var apply = function (el) {
            if (!el) return;
            if (val.h !== undefined) el.innerHTML = val.h;
            else el.textContent = val.t;
          };
          apply(g(id));
          document.querySelectorAll('[data-i18n="' + id + '"]').forEach(apply);
        });

        /* Hero titulares — solo actualiza texto, sin tocar opacity.
           La opacidad la maneja exclusivamente TextScramble al animar. */
        if (typeof CS_HERO_TEXTS !== 'undefined' && CS_HERO_TEXTS[lang]) {
          CS_HERO_TEXTS[lang].forEach(function (item) {
            var txt = item.text;
            var sync = function (el) { if (el) el.textContent = txt; };
            sync(g(item.el));
            document.querySelectorAll('[data-hero-line="' + item.el + '"]').forEach(sync);
          });
        }

        /* heroLine3b ya no se usa en ningún idioma */
        var line3b = document.getElementById('heroLine3b');
        if (line3b) line3b.style.display = 'none';

        /* Form labels (labels reales — a11y; ya no placeholders) */
        var form = CS_FORM[lang];
        var f = document.getElementById('contactForm');
        if (f) {
          var setL = function (id, txt) { var el = g(id); if (el) el.textContent = txt; };
          setL('form-l-nombre', form.nombre);
          setL('form-l-email', form.email);
          setL('form-l-whatsapp', form.whatsapp);
          setL('form-l-empresa', form.empresa);
          setL('form-l-servicio', form.servicio);
          setL('form-l-mensaje', form.mensaje);
          setL('form-l-tiene', form.tiene);
          setL('form-tgl-si', form.tieneSi);
          setL('form-tgl-no', form.tieneNo);
          setL('form-l-sitio', form.sitio);
          setL('form-l-negocio', form.negocio);
          var fSitio = g('f-sitio'), fNegocio = g('f-negocio');
          if (fSitio) fSitio.placeholder = form.sitioPh;
          if (fNegocio) fNegocio.placeholder = form.negocioPh;
          /* plan 2026-09: placeholders guía de WhatsApp y mensaje por idioma */
          var fWa = g('f-whatsapp'), fMsg = g('f-mensaje');
          if (fWa) fWa.placeholder = form.whatsappPh;
          if (fMsg) fMsg.placeholder = form.mensajePh;
          var sel = f.querySelector('[name="servicio"]');
          if (sel) {
            sel.options[0].text = form.servicioPh;
            var vals = ['web', 'ecommerce', 'branding', 'seo', 'mantenimiento', 'consultoria', 'auditoria-gratis', 'otro'];
            vals.forEach(function (v, i) {
              var opt = sel.querySelector('[value="' + v + '"]');
              if (opt) opt.text = form.opts[i];
            });
          }
        }

        /* Toggle button label */
        var btn = g('langToggle'), mbtn = g('mnav-lang');
        if (btn) { btn.textContent = lang === 'es' ? 'EN' : 'ES'; btn.classList.toggle('active-en', lang === 'en'); }
        if (mbtn) { mbtn.textContent = lang === 'es' ? 'EN' : 'ES'; }

        /* Portfolio i18n (injected server-side via SSR) */
        if (window.CS_PORTFOLIO_I18N && window.CS_PORTFOLIO_I18N[lang]) {
          var portDict = window.CS_PORTFOLIO_I18N[lang];
          Object.keys(portDict).forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.textContent = portDict[id].t;
          });
        }

        /* WhatsApp links */
        document.querySelectorAll('[data-wa-es]').forEach(function (el) {
          el.href = lang === 'en' ? el.dataset.waEn : el.dataset.waEs;
        });

        /* Lang-aware internal links (e.g. /nosotros/ ↔ /en/about-us/) */
        document.querySelectorAll('[data-href-es]').forEach(function (el) {
          el.href = lang === 'en' ? el.dataset.hrefEn : el.dataset.hrefEs;
        });

        /* html lang attribute */
        document.documentElement.lang = lang;

        /* Privacy link href */
        var pl = document.getElementById('fnav-privacy');
        if (pl) pl.href = lang === 'en' ? '/privacidad/?lang=en' : '/privacidad/';

        /* Persist */
        try { localStorage.setItem('cs-lang', lang); } catch (e) { }

        /* Re-inject navbar + footer partials in the target language.
           El middleware SSR los inyectó al cargar según URL; cuando el user
           togglea en HOME el footer/navbar quedan en el idioma original y los
           hrefs (e.g. /servicios/* vs /en/services/*) no se actualizan con
           el i18n loop. Re-fetch y replace garantiza labels + hrefs correctos.
           Skip en initial load (window._csLangReady true después del primer toggle). */
        if (window._csLangReady) {
          ['navbar', 'footer'].forEach(function (kind) {
            var ph = document.getElementById(kind + '-placeholder');
            if (!ph) return;
            var url = '/components/' + kind + (lang === 'en' ? '-en' : '') + '.html';
            fetch(url, { credentials: 'omit' })
              .then(function (r) { return r.ok ? r.text() : null; })
              .then(function (html) {
                if (!html) return;
                ph.innerHTML = html;
                /* Re-aplicar estado de scroll al navbar nuevo (sino el bg
                   transparente desaparece hasta que el user vuelve a scrollear). */
                if (kind === 'navbar') {
                  var nb = document.getElementById('navbar');
                  if (nb) nb.classList.toggle('scrolled', window.scrollY > 60);
                }
              })
              .catch(function () { /* no-op */ });
          });
        }
        window._csLangReady = true;

        /* plan 2026-09: textos dependientes del DOM (conteo de cards, clamp de bullets) */
        syncPortMore(lang);
        syncPlanClamp(lang);
      }

      /* ── PORTAFOLIO COLAPSADO (HOME-CRO-03) ─────────────────────
         Cuenta las .port-card que inyectó el SSR en #portfolio-dynamic; con ≤6
         no hay nada que expandir y el botón se oculta. */
      function syncPortMore(lang) {
        var btn = document.getElementById('port-more');
        if (!btn) return;
        var grid = document.querySelector('.port-grid');
        var n = document.querySelectorAll('#portfolio-dynamic .port-card').length;
        if (n <= 6 || !grid || !grid.classList.contains('is-collapsed')) { btn.style.display = 'none'; return; }
        btn.style.display = '';
        btn.textContent = lang === 'en' ? 'See all ' + n + ' projects →' : 'Ver los ' + n + ' proyectos →';
        if (!btn._csBound) {
          btn._csBound = true;
          btn.addEventListener('click', function () {
            grid.classList.remove('is-collapsed');
            btn.style.display = 'none';
          });
        }
      }

      /* ── PRICING MÓVIL: bullets colapsables (MOB-03) ────────────
         Corre tras setLang porque *-features se re-escriben con h:. Con >6 li
         en ≤768px: .plan-features--clamp + botón .plan-more/.plan-less. */
      function syncPlanClamp(lang) {
        if (!window.matchMedia('(max-width:768px)').matches) return;
        var dict = CS_I18N[lang];
        document.querySelectorAll('ul.plan-features').forEach(function (ul) {
          var extra = ul.querySelectorAll('li').length - 6;
          var btn = ul.nextElementSibling;
          if (!(btn && btn.classList.contains('plan-more'))) btn = null;
          if (extra < 2) { /* con 1 sobrante no vale la pena colapsar */
            ul.classList.remove('plan-features--clamp');
            if (btn) btn.remove();
            return;
          }
          if (!btn) {
            ul.classList.add('plan-features--clamp');
            btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'plan-more';
            ul.insertAdjacentElement('afterend', btn);
            btn.addEventListener('click', function () {
              var open = ul.classList.toggle('plan-features--clamp');
              btn.classList.toggle('plan-less', !open);
              btn.textContent = open ? btn.dataset.more : btn.dataset.less;
            });
          }
          btn.dataset.more = dict['plan-more'].t + ' (+' + extra + ')';
          btn.dataset.less = dict['plan-less'].t;
          btn.textContent = ul.classList.contains('plan-features--clamp') ? btn.dataset.more : btn.dataset.less;
        });
      }

      /* Desde jul 2026 existe /en/index.html real: el toggle NAVEGA entre las
         dos homes (URL = idioma, como el resto del sitio) en vez de traducir
         in-place — el in-place dejaba contenido EN bajo la URL ES, invisible
         para crawlers y con analytics/share-links mentirosos. */
      var CS_IS_EN_HOME = window.location.pathname.indexOf('/en') === 0;

      function toggleLang() {
        var goEn = !CS_IS_EN_HOME;
        try { localStorage.setItem('cs-lang', goEn ? 'en' : 'es'); } catch (e) { }
        window.location.href = goEn ? '/en/' : '/';
      }

      /* Init on DOMContentLoaded — el idioma lo dicta la URL, no localStorage */
      window.addEventListener('DOMContentLoaded', function () {
        setLang(CS_IS_EN_HOME ? 'en' : 'es');
      });

      /* Re-apply lang to navbar once components are injected */
      document.addEventListener('csComponentsReady', function () {
        setLang(CS_LANG);
      });

      /* ── FORM ──────────────────────────────────────────────────── */
      /* Envío propio via /api/contact → D1 + email vía Cloudflare Email Workers */

      var CONTACT_URL = '/api/contact';

      /* Mensajes de UI por idioma */
      var FORM_MSGS = {
        es: {
          sending: 'Enviando...',
          success: '¡Mensaje enviado! Te contactaremos en menos de 24 horas.',
          error: 'Hubo un problema al enviar. Intenta de nuevo o escríbenos a hola@cerostudio.ai.',
          errRequired: 'Por favor completa todos los campos obligatorios (*).',
          errEmail: 'Ingresa un email válido.',
          errWhatsapp: 'Revisa tu WhatsApp — deben ser 10 dígitos (ej. 55 1234 5678).',
          errSitio: 'Eso no parece un link — escribe algo como minegocio.mx. ¿Todavía no tienes sitio? Marca "Todavía no".',
          errNegocio: 'Cuéntanos el nombre y la dirección de tu negocio — con eso hacemos tu diagnóstico.',
          errBot: 'No pudimos verificar que eres humano. Recarga la página e inténtalo de nuevo, o escríbenos por WhatsApp.', /* plan 2026-09: 403 de Turnstile en el idioma del usuario */
          send: 'Quiero mi propuesta →',
          /* plan 2026-09: panel post-envío (.form-done) */
          doneTitle: 'Listo, {nombre}. Tu proyecto ya está en la bandeja de Carlos.',
          doneStep1: 'En menos de 24 horas te escribimos por WhatsApp al {whatsapp} con una propuesta clara.',
          doneStep2: 'Si quieres adelantar, agenda ahora tu llamada gratis.',
          doneStep3: 'Mientras tanto, mira cómo le fue a <a href="/casos-de-exito/imvec/">IMVEC (3× retorno)</a> y a <a href="/casos-de-exito/mainoflex/">Mainoflex (+40% ventas en 2 meses)</a>.',
          doneCal: 'Agendar mi llamada ahora →',
          doneCases: 'Ver casos de éxito →',
          doneCasesHref: '/casos-de-exito/',
          doneWa: 'Seguir por WhatsApp →',
          doneWaText: 'Hola, acabo de enviar el formulario desde cerostudio.ai — me interesa {plan}. ¿Seguimos por aquí?',
          doneWaTextPlain: 'Hola, acabo de enviar el formulario desde cerostudio.ai. ¿Seguimos por aquí?',
          doneAgain: 'Enviar otro mensaje',
        },
        en: {
          sending: 'Sending...',
          success: 'Message sent! We will get back to you within 24 hours.',
          error: 'Something went wrong. Try again or reach us at hola@cerostudio.ai.',
          errRequired: 'Please fill in all required fields (*).',
          errEmail: 'Please enter a valid email address.',
          errWhatsapp: 'Check your number — include your country code, e.g. +1 512 555 1234 or +52 55 1234 5678.', /* plan 2026-09: EN-04 */
          errSitio: 'That does not look like a link — try something like mybusiness.com. No website yet? Select "Not yet".',
          errNegocio: 'Tell us your business name and address — that is what we use for your diagnosis.',
          errBot: "We couldn't verify you're human. Reload the page and try again, or message us on WhatsApp.",
          send: 'Send me my proposal →',
          doneTitle: "Done, {nombre}. Your project just landed in Carlos's inbox.",
          doneStep1: "Within 24 hours we'll message you on WhatsApp at {whatsapp} with a clear proposal.",
          doneStep2: 'Want to move faster? Book your free call now.',
          doneStep3: 'In the meantime, see how it went for <a href="/en/case-studies/imvec/">IMVEC (3× return)</a> and <a href="/en/case-studies/mainoflex/">Mainoflex (+40% sales in 2 months)</a>.',
          doneCal: 'Book my call now →',
          doneCases: 'See case studies →',
          doneCasesHref: '/en/case-studies/',
          doneWa: 'Continue on WhatsApp →',
          doneWaText: "Hi, I just sent the form on cerostudio.ai — I'm interested in {plan}. Can we continue here?",
          doneWaTextPlain: 'Hi, I just sent the form on cerostudio.ai. Can we continue here?',
          doneAgain: 'Send another message',
        }
      };

      /* Normaliza a 10 dígitos MX: quita todo lo no-numérico y ladas +52/521 */
      function normalizeWhatsapp(v) {
        var d = String(v).replace(/\D/g, '');
        if (d.length === 12 && d.indexOf('52') === 0) d = d.slice(2);
        if (d.length === 13 && d.indexOf('521') === 0) d = d.slice(3);
        return d;
      }

      function validateForm(form) {
        var lang = (typeof CS_LANG !== 'undefined' ? CS_LANG : 'es');
        var msgs = FORM_MSGS[lang];
        var valid = true;

        /* Clear previous invalid marks */
        form.querySelectorAll('.invalid').forEach(function (el) { el.classList.remove('invalid'); });

        /* Required fields */
        var required = form.querySelectorAll('[required]');
        required.forEach(function (field) {
          if (!field.value.trim()) { field.classList.add('invalid'); valid = false; }
        });
        if (!valid) return { ok: false, msg: msgs.errRequired };

        /* Email format */
        var emailField = form.querySelector('[name="email"]');
        if (emailField && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value.trim())) {
          emailField.classList.add('invalid');
          return { ok: false, msg: msgs.errEmail };
        }

        /* WhatsApp: 10 dígitos MX; en /en/ se aceptan 10–15 con lada (EN-04) */
        var waField = form.querySelector('[name="whatsapp"]');
        var waLen = waField ? normalizeWhatsapp(waField.value).length : 10;
        if (waField && (lang === 'en' ? (waLen < 10 || waLen > 15) : waLen !== 10)) {
          waField.classList.add('invalid');
          return { ok: false, msg: msgs.errWhatsapp };
        }

        /* Bifurcación de auditoría: con sitio → URL con pinta de dominio;
           sin sitio → nombre/dirección del negocio. Los campos no llevan
           required nativo porque viven ocultos fuera de auditoría. */
        var selServicio = form.querySelector('[name="servicio"]');
        if (selServicio && selServicio.value === 'auditoria-gratis') {
          var conSitio = !form.querySelector('[name="tiene_sitio"][value="no"]:checked');
          if (conSitio) {
            var sitioField = form.querySelector('[name="sitio"]');
            var vSitio = sitioField ? sitioField.value.trim() : '';
            var limpio = vSitio.replace(/^https?:\/\//i, '').trim();
            if (!vSitio || limpio.indexOf(' ') !== -1 || !/\.[a-zA-Z]{2,}/.test(limpio)) {
              if (sitioField) sitioField.classList.add('invalid');
              return { ok: false, msg: msgs.errSitio };
            }
          } else {
            var negField = form.querySelector('[name="negocio"]');
            if (negField && !negField.value.trim()) {
              negField.classList.add('invalid');
              return { ok: false, msg: msgs.errNegocio };
            }
          }
        }

        return { ok: true };
      }

      /* ── PANEL POST-ENVÍO (.form-done) ──────────────────────────
         Oculta campos/Turnstile/submit vía form.is-done (CSS de A3) y arma el
         panel con DOM (nombre y WhatsApp del lead van como texto, nunca HTML). */
      var CS_CAL_URL = 'https://calendar.app.google/Mk3sTdFWsaaaUNnj6';
      function showFormDone(form, lang, lead) {
        var m = FORM_MSGS[lang];
        var old = form.querySelector('.form-done');
        if (old) old.remove();
        clearFeedback();

        var panel = document.createElement('div');
        panel.className = 'form-done';
        panel.setAttribute('role', 'status');

        var title = document.createElement('h3');
        title.className = 'form-done-title';
        title.textContent = m.doneTitle.replace('{nombre}', lead.nombre.trim().split(/\s+/)[0] || '');
        panel.appendChild(title);

        var ol = document.createElement('ol');
        ol.className = 'form-done-steps';
        var li1 = document.createElement('li');
        li1.textContent = m.doneStep1.replace('{whatsapp}', lead.whatsapp);
        var li2 = document.createElement('li');
        li2.textContent = m.doneStep2;
        var li3 = document.createElement('li');
        li3.innerHTML = m.doneStep3; /* texto fijo del dict con links a los casos */
        ol.appendChild(li1); ol.appendChild(li2); ol.appendChild(li3);
        panel.appendChild(ol);

        /* WhatsApp prellenado con el plan clicado o, en su defecto, el servicio del select */
        var what = CS_PLAN ? CS_PLAN.name : '';
        if (!what && lead.servicio) {
          var vals = ['web', 'ecommerce', 'branding', 'seo', 'mantenimiento', 'consultoria', 'auditoria-gratis', 'otro'];
          var idx = vals.indexOf(lead.servicio);
          if (idx !== -1 && lead.servicio !== 'otro') what = CS_FORM[lang].opts[idx];
        }
        var waText = what ? m.doneWaText.replace('{plan}', what) : m.doneWaTextPlain;

        var actions = document.createElement('div');
        actions.className = 'form-done-actions';
        var mk = function (cls, href, txt, blank) {
          var a = document.createElement('a');
          a.className = cls; a.href = href; a.textContent = txt;
          if (blank) { a.target = '_blank'; a.rel = 'noopener'; }
          return a;
        };
        actions.appendChild(mk('btn-primary ht form-done-cal', CS_CAL_URL, m.doneCal, true));
        actions.appendChild(mk('btn-ghost ht form-done-cases', m.doneCasesHref, m.doneCases, false));
        actions.appendChild(mk('btn-ghost ht form-done-wa', waHref(waText), m.doneWa, true));
        panel.appendChild(actions);

        var again = document.createElement('button');
        again.type = 'button';
        again.className = 'form-done-again';
        again.textContent = m.doneAgain;
        panel.appendChild(again);

        /* Los enlaces secundarios bajo el submit duplicarían los del panel */
        var aside = ['form-reassure', 'agenda-link', 'contact-wa'].map(function (id) { return document.getElementById(id); });
        aside.forEach(function (el) {
          if (!el) return;
          if (el.dataset.csDisp === undefined) el.dataset.csDisp = el.style.display; /* agenda-link/contact-wa traen display:block inline */
          el.style.display = 'none';
        });

        again.addEventListener('click', function () {
          panel.remove();
          form.classList.remove('is-done');
          aside.forEach(function (el) { if (el) el.style.display = el.dataset.csDisp || ''; });
          form.reset();
          if (typeof syncAudit === 'function') syncAudit();
          clearFeedback();
          var first = form.querySelector('[name="nombre"]');
          if (first) first.focus();
        });

        form.classList.add('is-done');
        form.appendChild(panel);
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      function setFeedback(type, msg) {
        var fb = document.getElementById('formFeedback');
        if (!fb) return;
        fb.className = 'form-feedback ' + type;
        fb.textContent = msg;
        fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      function clearFeedback() {
        var fb = document.getElementById('formFeedback');
        if (fb) { fb.className = 'form-feedback'; fb.textContent = ''; }
      }

      function handleSubmit(e) {
        e.preventDefault();
        var form = e.target;
        var btn = document.getElementById('submitBtn');
        var label = document.getElementById('submitBtnLabel');
        var lang = (typeof CS_LANG !== 'undefined' ? CS_LANG : 'es');
        var msgs = FORM_MSGS[lang];

        /* Honeypot check (filled by bots) */
        if (form.querySelector('[name="_gotcha"]') && form.querySelector('[name="_gotcha"]').value) return;

        /* Client-side validation */
        clearFeedback();
        var check = validateForm(form);
        if (!check.ok) { setFeedback('error', check.msg); return; }

        /* Submit */
        btn.classList.add('loading');
        label.textContent = msgs.sending;
        btn.disabled = true;

        var fd = new FormData(form);
        var payload = {};
        fd.forEach(function(v, k) { payload[k] = v; });

        /* WhatsApp normalizado a 10 dígitos (el server lo re-sanitiza igual) */
        var waTyped = (payload.whatsapp || '').trim(); /* tal cual lo escribió, para el panel post-envío */
        if (payload.whatsapp) payload.whatsapp = normalizeWhatsapp(payload.whatsapp);

        /* Bifurcación de auditoría: fuera de auditoría los campos ocultos no
           viajan; sin sitio → 'sitio' lleva el nombre/dirección del negocio */
        if (payload.servicio === 'auditoria-gratis') {
          if (payload.tiene_sitio === 'no') payload.sitio = payload.negocio || '';
        } else {
          delete payload.tiene_sitio;
          delete payload.sitio;
        }
        delete payload.negocio;

        /* Turnstile: el widget inyecta cf-turnstile-response; el API espera snake_case */
        payload.cf_turnstile_response = payload['cf-turnstile-response'] || '';
        delete payload['cf-turnstile-response'];

        /* event_id para deduplicar Pixel (browser) vs CAPI (server) en Meta */
        var eventId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2);
        payload.event_id = eventId;
        payload.page_url = location.href;
        if (window.CS_META) { payload.consent = window.CS_META.consent() || ''; payload.fbp = window.CS_META.fbp(); payload.fbc = window.CS_META.fbc(); }

        fetch(CONTACT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(function (res) {
            btn.classList.remove('loading');
            btn.disabled = false;
            label.textContent = msgs.send;
            if (window.turnstile) window.turnstile.reset(); /* el token es de un solo uso */
            if (res.ok) {
              /* Conversión medible: GTM define el tag GA4 sobre este evento */
              window.dataLayer = window.dataLayer || [];
              window.dataLayer.push({ event: 'lead_form_submit', form_type: payload.servicio || 'contacto', event_id: eventId });
              /* plan 2026-09 (HOME-CRO-06/LEAD-01): panel post-envío en lugar de la línea de éxito */
              showFormDone(form, lang, { nombre: payload.nombre || '', whatsapp: waTyped, servicio: payload.servicio || '' });
              form.reset();
              if (typeof syncAudit === 'function') syncAudit();
            } else if (res.status === 403) {
              /* plan 2026-09 (HOME-CRO-05): Turnstile falló → mensaje en el idioma del usuario */
              setFeedback('error', msgs.errBot);
            } else {
              return res.json().then(function (data) {
                var errMsg = (data && data.error) ? data.error
                  : (data && data.errors) ? data.errors.map(function (x) { return x.message; }).join(', ')
                  : msgs.error;
                setFeedback('error', errMsg);
              });
            }
          })
          .catch(function () {
            btn.classList.remove('loading');
            btn.disabled = false;
            label.textContent = msgs.send;
            setFeedback('error', msgs.error);
          });
      }

      // Expose needed functions to global scope for inline event listeners
      window.toggleNav = toggleNav;
      window.closeNav = closeNav;
      window.toggleLang = toggleLang;
      window.handleSubmit = handleSubmit;
      /* CSP-safe: el form ya no usa onsubmit= inline */
      var _cf = document.getElementById('contactForm');
      if (_cf) _cf.addEventListener('submit', handleSubmit);

      /* Bloque de auditoría: visible solo con servicio=auditoria-gratis;
         dentro, el toggle "¿Ya tienes sitio?" alterna URL ↔ negocio */
      if (_cf) {
        var _sel = _cf.querySelector('[name="servicio"]');
        var _grpAudit = document.getElementById('grp-audit');
        var _grpSitio = document.getElementById('grp-sitio');
        var _grpNegocio = document.getElementById('grp-negocio');
        var syncAudit = function () {
          if (!_grpAudit) return;
          _grpAudit.hidden = !(_sel && _sel.value === 'auditoria-gratis');
          var noSitio = _cf.querySelector('[name="tiene_sitio"][value="no"]:checked');
          if (_grpSitio) _grpSitio.hidden = !!noSitio;
          if (_grpNegocio) _grpNegocio.hidden = !noSitio;
        };
        if (_sel) _sel.addEventListener('change', syncAudit);
        _cf.querySelectorAll('[name="tiene_sitio"]').forEach(function (r) {
          r.addEventListener('change', syncAudit);
        });
        syncAudit();

        /* plan 2026-09 (SV-07/NC-05/LEAD-02): ?servicio= y ?ref= desde fichas y
           casos. Solo lectura en cliente (no fragmenta la caché SSR) y con
           whitelist: nada de la URL llega al textarea tal cual. */
        try {
          var REF_CASES = { imvec: 'IMVEC', mainoflex: 'Mainoflex', 'respirar-es-vivir': 'Respirar es Vivir', 'seminuevos-coapa': 'Seminuevos Coapa', 'sergio-luque': 'Sergio Luque' };
          var qs = new URLSearchParams(location.search);
          var refCase = REF_CASES[qs.get('ref')];
          var refServ = qs.get('servicio');
          if (refServ && _sel && Array.prototype.some.call(_sel.options, function (o) { return o.value === refServ; })) {
            _sel.value = refServ;
            _sel.dispatchEvent(new Event('change')); /* → syncAudit */
          }
          var refMsg = _cf.querySelector('[name="mensaje"]');
          if (refCase && refMsg && !refMsg.value.trim()) {
            refMsg.value = CS_IS_EN_HOME
              ? 'I saw the ' + refCase + ' case study and I want a result like that for my business.'
              : 'Vi el caso de ' + refCase + ' y quiero un resultado así para mi negocio.';
          }
        } catch (e) { /* URLSearchParams no disponible: sin prefill */ }
      }
    }); // end DOMContentLoaded
