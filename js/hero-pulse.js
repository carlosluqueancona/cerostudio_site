/* ══════════════════════════════════════════════════════════════════════
   HERO "PULSO DE VENTA" — módulo reutilizable (extraído de js/home.js)
   ──────────────────────────────────────────────────────────────────────
   QUÉ ES
     Animación de canvas estilo electrocardiograma: gráficas vivas de
     VISITAS / INTERACCIONES / MENSAJES / PROSPECTOS / VENTAS entrando en
     tiempo real, con picos (spikes), destellos, números "+N" flotantes,
     contadores acumulados y una interacción de click-combo (clicks rápidos
     cerca de una línea engordan un mismo pico). La línea blanca plana al
     fondo = "tu negocio SIN SITIO" (stakes StoryBrand).

   TARGET RECOMENDADO
     /servicios/seo/  (posicionamiento → tráfico/visitas). La metáfora de
     "líneas que suben" encaja con crecimiento orgánico / tráfico.

   DOM MÍNIMO REQUERIDO
     Un contenedor con  position:relative; overflow:hidden; background:#000
     que tenga dentro:
        <canvas id="heroCanvas"></canvas>
        <div class="hero-grid"></div>           (rejilla lime opcional)
     y opcionalmente  <div class="hero-inner">…</div>  para el texto encima.
     (Ver la clase helper .hero-pulse-host en /css/hero-pulse.css.)

   INCLUDES
     <link rel="stylesheet" href="/css/hero-pulse.css">
     <script src="/js/hero-pulse.js" defer></script>

   CÓMO ACTIVAR "VISITAS" (tráfico)
     Por defecto el embudo muestra sólo conversión (mensajes/prospectos/
     ventas). Para una página de SEO/posicionamiento conviene mostrar la
     línea de VISITAS: dentro de resize() cambia  use = [2, 3, 4]  por
     use = [0, 2, 3, 4]  (ver el comentario en esa línea).

   DEPENDENCIAS
     NINGUNA externa: no usa GSAP ni depende de home.js. El módulo trae su
     propio tracker de cursor (_mx/_my) y detecta idioma vía
     document.documentElement.lang, así que funciona standalone.
   ══════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
      (window.requestIdleCallback || (cb => setTimeout(cb, 200)))(function () {
      (function () {
        const canvas = document.getElementById('heroCanvas');
        if (!canvas) return;

        /* tracker de cursor propio del módulo (standalone, sin home.js) */
        var _mx = window.innerWidth / 2, _my = window.innerHeight / 2;
        document.addEventListener('mousemove', function (e) { _mx = e.clientX; _my = e.clientY; });

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const ctx = canvas.getContext('2d');
        const LIME = '178,247,0';
        const SPIKE_LEN = 22;
        const CLICK_NEAR = 100;   /* px en X: si el cursor se aleja >100px del ancla, se desengancha (pico nuevo) */
        const CLICK_HOVER = typeof window.matchMedia === 'function' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

        let W, H, dx, N, bound, tight, echoBase, userCeil;
        let kHead = 0;            /* índice de muestra en el borde derecho */
        let channels = [];        /* canales del embudo: cada línea = métrica viva */
        let counts = null;        /* contadores acumulados por métrica (persisten en resize) */
        let ghosts = [];          /* telemetría fantasma tenue detrás del texto */
        let pings = [];           /* ondas compartidas por evento de venta */
        let comboCh = null;       /* canal con combo de clicks activo (para desenganche por cursor) */

        /* Embudo StoryBrand: el sitio convierte extraños en clientes.
           entrada → conversión (arriba → abajo). Cada canal tiene su tren de
           picos con CANTIDADES variables, destellos y contador propio. */
        const CH_DEFS = [
          { key: 'visitas',       es: 'VISITAS',       en: 'VISITS',       lime: false, glow: false, inc: [14, 60], rate: [26, 54],  base: 4200, seed: 120 },
          { key: 'interacciones', es: 'INTERACCIONES', en: 'INTERACTIONS', lime: false, glow: false, inc: [7, 30],  rate: [32, 66],  base: 1480, seed: 340 },
          { key: 'mensajes',      es: 'MENSAJES',      en: 'MESSAGES',     lime: true,  glow: true,  inc: [2, 11],  rate: [44, 96],  base: 372,  seed: 560, hero: true, alpha: .60 },
          { key: 'prospectos',    es: 'PROSPECTOS',    en: 'LEADS',        lime: true,  glow: true,  inc: [1, 5],   rate: [58, 128], base: 126,  seed: 780, hero: true, alpha: .80 },
          { key: 'ventas',        es: 'VENTAS',        en: 'SALES',        lime: true,  glow: true,  inc: [1, 3],   rate: [40, 88],  base: 34,   seed: 20, hero: true },
        ];

        function resize() {
          W = canvas.width = window.innerWidth;
          H = canvas.height = window.innerHeight;
          dx = W < 768 ? 6 : 3;   /* px entre muestras */
          N = Math.ceil(W / dx) + 2;

          /* Geometría real: dos bandas que ENMARCAN el titular — superior
             (arriba del eyebrow) e inferior (debajo de los CTAs) — para que
             las líneas ocupen mucho más espacio vertical sin tocar el texto. */
          const hr = canvas.parentElement.getBoundingClientRect();
          function rel(id, edge) {
            const el = document.getElementById(id);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return (edge === 'top' ? r.top : r.bottom) - hr.top;
          }
          const titleEl = document.querySelector('.hero-static-title');
          let titleBot = titleEl ? (titleEl.getBoundingClientRect().bottom - hr.top) : H * .5;
          echoBase = H - 16;

          /* UNA sola banda de ~200px: baja hasta el fondo y sube lo necesario
             para ocupar 200px, sin comerse el título. El texto (DOM) va por
             encima del canvas; los botones sólidos tapan las líneas limpio. */
          const bandBot = echoBase - 18;
          let bandTop = bandBot - 200;                       /* banda objetivo 200px */
          bandTop = Math.max(bandTop, Math.round(titleBot + 16));  /* no comerse el título */
          bound = bandTop;
          userCeil = Math.round(titleBot + 16);   /* techo alto SOLO para picos de click */
          const roomy = bandBot - bandTop;
          tight = roomy < 150;

          /* solo conversión (embudo SB7): mensajes · prospectos · ventas */
          /* Para mostrar VISITAS (tráfico) en una página de SEO/posicionamiento: use = [0, 2, 3, 4]. */
          let use = [2, 3, 4];
          if (roomy < 150) use = [2, 4];
          if (roomy < 90) use = [4];
          const slot = roomy / use.length;
          channels = use.map(function (defIdx, i) {
            const y = bandTop + slot * (i + 0.5);
            const amp = Math.max(22, slot * 0.5);
            return {
              def: CH_DEFS[defIdx],
              y: y,
              amp: amp,
              ceil: Math.max(bandTop, y - amp - 6),      /* picos locales, no invaden arriba */
              clipTop: Math.round(y - amp - 22), clipBot: Math.round(y + slot * 0.6),
              spikes: [], nextK: 90 + defIdx * 22, first: !!CH_DEFS[defIdx].hero,
              combo: 0, lastClickK: -999, activeClick: null, anchorX: 0,
            };
          });

          if (!counts) {                    /* sembrar una vez (dashboard "desde el lanzamiento") */
            counts = {};
            for (let ci = 0; ci < CH_DEFS.length; ci++) {
              counts[CH_DEFS[ci].key] = CH_DEFS[ci].base + Math.floor(Math.random() * CH_DEFS[ci].base * 0.25);
            }
          }

          ghosts = [];   /* sin líneas arriba: titular limpio sobre negro */
        }

        /* ruido suave determinista por índice de muestra */
        function noise(k, a) {
          return Math.sin(k * .11) * 2 * a + Math.sin(k * .043 + 1.7) * 3 * a + Math.sin(k * .021 + 4.2) * 4.5 * a;
        }

        /* pico angosto hacia arriba (y negativo) — para que las OTRAS líneas
           también tengan actividad, no solo ondas. pow alto = cresta afilada. */
        function crest(k, f, amp) {
          const s = Math.sin(k * f);
          return s > 0 ? -Math.pow(s, 12) * amp : 0;
        }

        /* forma QRS por tramos rectos — sin easing, brutal como un EKG real */
        function qrs(s, amp) {
          if (s < 0 || s > SPIKE_LEN) return 0;
          if (s < 3) return (s / 3) * amp * .12;
          if (s < 7) return amp * .12 - ((s - 3) / 4) * amp * 1.12;
          if (s < 11) return -amp + ((s - 7) / 4) * amp * 1.3;
          if (s < 15) return amp * .3 - ((s - 11) / 4) * amp * .36;
          return (1 - (s - 15) / 7) * -amp * .06;
        }

        /* agenda picos de UN canal, con cantidad (qty) y altura variables:
           picos chicos frecuentes + picos grandes ocasionales (12%). */
        function schedule(ch) {
          const d = ch.def;
          const qLo = d.inc[0], qHi = d.inc[1];
          while (ch.nextK < kHead + N) {
            let qty;
            if (ch.first) { qty = qHi; ch.first = false; }
            else {
              qty = qLo + Math.floor(Math.random() * (qHi - qLo + 1));
              if (Math.random() < .12) qty = Math.round(qty * (1.6 + Math.random() * 1.4));  /* pico grande ocasional */
            }
            /* altura PROPORCIONAL al número real: amp ∝ qty/qHi (a través de
               cero), por canal. +1 = blip corto; el máximo del canal llena el
               carril; los picos grandes se topan ahí. El ojo lee "el doble de
               número, el doble de alto" dentro de cada línea. */
            const amp = ch.amp * Math.max(.15, Math.min(1, qty / qHi));
            ch.spikes.push({ k0: ch.nextK, amp: amp, qty: qty, counted: false, flash: 0 });
            ch.nextK += d.rate[0] + Math.floor(Math.random() * (d.rate[1] - d.rate[0]));
          }
          while (ch.spikes.length && ch.spikes[0].k0 + SPIKE_LEN < kHead - N) ch.spikes.shift();
        }

        /* y de un canal: ruido base + picos. Los picos ORGÁNICOS se topan al
           techo local del carril (ch.ceil); los picos de CLICK del usuario
           pueden crecer proporcional al combo hasta userCeil (bajo el título). */
        function chY(ch, k, x) {
          let a = 1;
          const dxc = Math.abs(x - _mx);
          if (dxc < 200) a = 1 + (1 - dxc / 200) * 1.4;
          let org = 0, usr = 0;
          for (let i = 0; i < ch.spikes.length; i++) {
            const s = ch.spikes[i];
            const v = qrs(k - s.k0, s.amp);
            if (s.user) usr += v; else org += v;
          }
          const organic = Math.max(ch.ceil, ch.y + noise(k * .9 + ch.def.seed, a) + org);
          return Math.max(userCeil, organic + usr);
        }

        /* eco "sin sitio": plano y muerto — el negocio sin sitio (stakes SB7) */
        function echoY(k) {
          return echoBase + noise(k * .6 + 900, .26);
        }

        function buildPath(yOf) {
          const p = new Path2D();
          for (let i = 0; i <= N; i++) {
            const k = kHead - (N - i);
            const x = i * dx;
            const y = yOf(k, x);
            if (i === 0) p.moveTo(x, y); else p.lineTo(x, y);
          }
          return p;
        }

        /* área entre la curva y una base dada (relleno de degradado) */
        function buildAreaPathTo(yOf, yBottom) {
          const p = new Path2D();
          p.moveTo(0, yBottom);
          for (let i = 0; i <= N; i++) {
            const k = kHead - (N - i);
            const x = i * dx;
            p.lineTo(x, yOf(k, x));
          }
          p.lineTo(W, yBottom);
          p.closePath();
          return p;
        }

        function renderFrame() {
          ctx.clearRect(0, 0, W, H);
          /* desenganche por CURSOR: si el mouse se aleja >CLICK_NEAR px del ancla
             del combo activo, suéltalo (el próximo click abre un pico nuevo). */
          if (CLICK_HOVER && comboCh && Math.abs(_mx - comboCh.anchorX) > CLICK_NEAR) {
            comboCh.activeClick = null; comboCh.combo = 0; comboCh = null;
          }
          const dim = tight ? .82 : 1;
          const en = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0;

          /* barrido de escaneo recorriendo el hero */
          const sx = ((kHead * 3.2) % (W + 600)) - 300;
          const grad = ctx.createLinearGradient(sx - 80, 0, sx + 80, 0);
          grad.addColorStop(0, 'rgba(' + LIME + ',0)');
          grad.addColorStop(.5, 'rgba(' + LIME + ',.05)');
          grad.addColorStop(1, 'rgba(' + LIME + ',0)');
          ctx.fillStyle = grad;
          ctx.fillRect(sx - 80, 0, 160, H);

          /* fantasmas tenues detrás del texto (ambiente) */
          for (let i = 0; i < ghosts.length; i++) {
            const g = ghosts[i];
            const drift = kHead * g.spd;
            const gp = buildPath(function (k) {
              return g.y + noise(k * g.f + g.seed + drift, g.amp)
                + crest(k + g.seed, g.cf1, g.peak) + crest(k + g.seed * 1.7, g.cf2, g.peak * .6);
            });
            if (g.lime) { ctx.shadowColor = 'rgba(' + LIME + ',.9)'; ctx.shadowBlur = 7; ctx.strokeStyle = 'rgba(' + LIME + ',.22)'; ctx.lineWidth = 1.2; }
            else { ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,.10)'; ctx.lineWidth = 1; }
            ctx.stroke(gp);
          }
          ctx.shadowBlur = 0;

          /* SIN SITIO — línea plana muerta al fondo */
          ctx.strokeStyle = 'rgba(255,255,255,.18)';
          ctx.lineWidth = 1;
          ctx.stroke(buildPath(echoY));

          /* contar picos que cruzan su ápex (por canal) + registrar destellos/pings */
          for (let c = 0; c < channels.length; c++) {
            const ch = channels[c];
            schedule(ch);
            for (let i = 0; i < ch.spikes.length; i++) {
              const sp = ch.spikes[i];
              if (!sp.counted && kHead >= sp.k0 + 7) {
                sp.counted = true;
                counts[ch.def.key] += sp.qty;
                sp.flash = 3;
                if (ch.def.hero) pings.push({ kApex: sp.k0 + 7, y: ch.y - sp.amp, r: 4 });
              }
            }
          }

          /* dibujar cada canal del embudo (tenue arriba → brillante abajo) */
          for (let c = 0; c < channels.length; c++) {
            const ch = channels[c];
            const d = ch.def;
            const yFn = function (k, x) { return chY(ch, k, x); };
            ctx.save();
            ctx.globalAlpha = d.alpha == null ? 1 : d.alpha;   /* opacidad maestra por línea (20/40/100) */
            const path = buildPath(yFn);
            const bright = d.hero ? 1 : d.lime ? .82 : .5;

            /* área rellena bajo la línea (cordillera encendida) */
            const fillBot = d.hero ? echoBase : ch.y + 18;
            const af = (d.hero ? .30 : d.lime ? .15 : .07) * dim;
            const ag = ctx.createLinearGradient(0, ch.y - ch.amp, 0, fillBot);
            ag.addColorStop(0, (d.lime ? 'rgba(' + LIME + ',' : 'rgba(255,255,255,') + af + ')');
            ag.addColorStop(1, (d.lime ? 'rgba(' + LIME + ',0)' : 'rgba(255,255,255,0)'));
            ctx.fillStyle = ag;
            ctx.fill(buildAreaPathTo(yFn, fillBot));

            /* línea con glow según el canal */
            if (d.glow) { ctx.shadowColor = d.lime ? 'rgba(' + LIME + ',1)' : 'rgba(255,255,255,.9)'; ctx.shadowBlur = (d.hero ? 20 : 11) * dim; }
            else ctx.shadowBlur = 0;
            ctx.strokeStyle = (d.lime ? 'rgba(' + LIME + ',' : 'rgba(255,255,255,') + bright + ')';
            ctx.lineWidth = d.hero ? 2.6 : d.lime ? 1.8 : 1.4;
            ctx.stroke(path);
            if (d.hero) { ctx.shadowBlur = 9 * dim; ctx.strokeStyle = '#eaffbf'; ctx.lineWidth = 1.2; ctx.stroke(path); }
            ctx.shadowBlur = 0;

            /* cabeza brillante en el borde derecho */
            const hy = yFn(kHead, W);
            if (d.glow) { ctx.shadowColor = d.lime ? 'rgba(' + LIME + ',1)' : 'rgba(255,255,255,.9)'; ctx.shadowBlur = d.hero ? 20 : 12; }
            ctx.fillStyle = d.lime ? '#f2ffcf' : '#ffffff';
            ctx.beginPath(); ctx.arc(W - 2, hy, d.hero ? 4.5 : 3, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;

            /* destellos + "+N" flotante por pico (variedad de cantidades).
               clip alto para que los picos de click (proporcionales) muestren
               su destello y número aunque se disparen cerca del título. */
            ctx.save();
            const clipT = Math.min(ch.clipTop, userCeil - 8);
            ctx.beginPath(); ctx.rect(0, clipT, W, ch.clipBot - clipT); ctx.clip();
            ctx.textAlign = 'center';
            for (let i = 0; i < ch.spikes.length; i++) {
              const sp = ch.spikes[i];
              const apex = sp.k0 + 7, age = kHead - apex;
              const px = (N - age) * dx;
              if (px < -60 || px > W + 60) continue;
              /* altura REAL de la línea en el pico (incluye el stacking de clicks) */
              const py = chY(ch, apex, px);
              if (sp.flash > 0) {
                sp.flash += 3.2;
                const ff = 1 - sp.flash / 80;
                if (ff > 0) {
                  const rg = ctx.createRadialGradient(px, py, 0, px, py, sp.flash);
                  rg.addColorStop(0, (d.lime ? 'rgba(' + LIME + ',' : 'rgba(255,255,255,') + (.5 * ff) + ')');
                  rg.addColorStop(1, (d.lime ? 'rgba(' + LIME + ',0)' : 'rgba(255,255,255,0)'));
                  ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(px, py, sp.flash, 0, Math.PI * 2); ctx.fill();
                } else sp.flash = 0;
              }
              /* número en CADA pico: anclado justo encima, viaja con el pico.
                 Aparece por la derecha y se desvanece al salir por la izquierda. */
              if (apex <= kHead && px > -10) {
                let op = 1;
                if (px > W - 46) op = (W + 6 - px) / 52;   /* entra por la derecha */
                if (px < 46) op = px / 52;                  /* sale por la izquierda */
                op = Math.max(0, Math.min(1, op));
                if (op > 0) {
                  const uv = sp.user;
                  /* el número va JUSTO encima de la punta REAL del pico, así su
                     altura sigue al pico (coherente con el +N). Solo el pico de
                     click se topa a userCeil para no invadir el título. */
                  const numY = uv ? Math.max(userCeil + 10, py - 11) : py - 11;
                  ctx.font = '700 ' + (uv ? 18 : d.hero ? 14 : 12) + 'px "Space Grotesk", sans-serif';
                  ctx.fillStyle = (d.lime ? 'rgba(' + LIME + ',' : 'rgba(255,255,255,') + (op * (uv ? 1 : d.lime ? .9 : .62)) + ')';
                  ctx.fillText('+' + sp.qty, px, numY);
                }
              }
            }
            ctx.restore();

            /* indicador vivo del canal: ▲ count  LABEL (izquierda, sobre su línea) */
            const big = !!d.hero;
            const cy = ch.y - (big ? 12 : 9);
            ctx.textAlign = 'left';
            ctx.fillStyle = d.lime ? 'rgba(' + LIME + ',' + (big ? 1 : .85) + ')' : 'rgba(255,255,255,.72)';
            ctx.font = '700 ' + (big ? 21 : 13) + 'px "Space Grotesk", sans-serif';
            const numStr = '▲ ' + counts[d.key].toLocaleString('en-US');
            ctx.fillText(numStr, 26, cy);
            const nw = ctx.measureText(numStr).width;
            try { ctx.letterSpacing = '2px'; } catch (e) { }
            ctx.font = '700 ' + (big ? 10 : 9) + 'px "Space Grotesk", sans-serif';
            ctx.fillStyle = d.lime ? 'rgba(' + LIME + ',.5)' : 'rgba(255,255,255,.38)';
            ctx.fillText(en ? d.en : d.es, 26 + nw + 10, cy - (big ? 3 : 1));
            try { ctx.letterSpacing = '0px'; } catch (e) { }
            ctx.restore();
          }

          /* SIN SITIO — contador en 0, la línea muerta (stakes SB7) */
          try { ctx.letterSpacing = '2px'; } catch (e) { }
          ctx.textAlign = 'left';
          ctx.font = '700 9px "Space Grotesk", sans-serif';
          ctx.fillStyle = 'rgba(255,255,255,.3)';
          ctx.fillText(en ? '0   WITHOUT A SITE' : '0   SIN SITIO', 26, echoBase - 8);
          try { ctx.letterSpacing = '0px'; } catch (e) { }

          /* pings compartidos (solo ventas) — ondas que se expanden */
          ctx.save();
          ctx.beginPath(); ctx.rect(0, bound, W, H - bound); ctx.clip();
          for (let i = pings.length - 1; i >= 0; i--) {
            const p = pings[i];
            p.r += 2;
            const a = .45 * (1 - p.r / 70);
            if (a <= 0) { pings.splice(i, 1); continue; }
            const px = (N - (kHead - p.kApex)) * dx;
            if (px < -80 || px > W + 80) { pings.splice(i, 1); continue; }
            ctx.strokeStyle = 'rgba(' + LIME + ',' + a + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(px, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
          }
          ctx.restore();
        }

        let rafId;
        let frameInterval, lastFrameTime = 0;

        function draw(now) {
          rafId = requestAnimationFrame(draw);
          if (now - lastFrameTime < frameInterval) return;
          lastFrameTime = now;
          kHead += 1.05;   /* velocidad de barrido — más movimiento */
          renderFrame();
        }

        resize();
        frameInterval = 1000 / (W < 768 ? 30 : 60);

        if (prefersReducedMotion) {
          /* frame único con picos ya en pantalla — sin loop */
          kHead = 430; channels.forEach(schedule); renderFrame();
        } else {
          new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
              if (!rafId) { lastFrameTime = 0; rafId = requestAnimationFrame(draw); }
            } else if (rafId) {
              cancelAnimationFrame(rafId); rafId = null;
            }
          }, { threshold: 0 }).observe(canvas.parentElement);
          /* arranque inmediato si el hero ya está en viewport — no
             dependemos del primer callback del IO para el primer frame */
          const r0 = canvas.parentElement.getBoundingClientRect();
          if (r0.bottom > 0 && r0.top < window.innerHeight && !rafId) {
            lastFrameTime = 0; rafId = requestAnimationFrame(draw);
          }
        }

        window.addEventListener('resize', () => {
          resize();               /* reconstruye canales (spikes vacíos) */
          frameInterval = 1000 / (W < 768 ? 30 : 60);
          pings = [];
          if (prefersReducedMotion) { kHead += 430; channels.forEach(schedule); renderFrame(); }
        });

        /* click/tap en el fondo del hero = evento en la línea MÁS CERCANA.
           Clicks rápidos seguidos ACUMULAN en un mismo pico: crece de altura
           y el número flotante muestra la SUMA de clicks. Cada click suma +1
           al contador de esa línea. */
        canvas.parentElement.addEventListener('click', function (e) {
          if (prefersReducedMotion) return;
          if (e.target.closest('a, button, input, select, textarea')) return;
          const rect = canvas.getBoundingClientRect();
          const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
          let ch = null, best = 1e9;
          for (let c = 0; c < channels.length; c++) {
            const dd = Math.abs(cy - channels[c].y);
            if (dd < best) { best = dd; ch = channels[c]; }
          }
          if (!ch) return;
          /* combo: el 1er click cerca de una línea CREA un pico ancla (+1). Los
             clicks siguientes que caen a ≤CLICK_NEAR px del PRIMER click, dentro
             de ~1s, NO crean picos nuevos: ENGORDAN el mismo pico ancla (+2, +3,
             …) creciendo su altura. Si te alejas o tardas, arranca ancla nueva. */
          const near = (kHead - ch.lastClickK < 60) && Math.abs(cx - ch.anchorX) < CLICK_NEAR;
          ch.lastClickK = kHead;
          if (near && ch.activeClick) {
            ch.combo += 1;
            const sp = ch.activeClick;                       /* el MISMO pico crece */
            sp.amp = Math.min(ch.y - userCeil, ch.amp * .5 * ch.combo);
            sp.qty = ch.combo;
            sp.flash = 6; sp.textK = kHead;
          } else {
            ch.combo = 1; ch.anchorX = cx;                   /* ancla nueva */
            const k0 = Math.round(kHead - N + cx / dx) - 7;  /* pico en la X del mouse */
            const sp = { k0: k0, amp: Math.min(ch.y - userCeil, ch.amp * .5), qty: 1, counted: true, flash: 6, user: true, textK: kHead };
            ch.spikes.push(sp);
            ch.spikes.sort(function (a, b) { return a.k0 - b.k0; });
            ch.activeClick = sp;
          }
          counts[ch.def.key] += 1;   /* el contador suma cada click */
          comboCh = ch;              /* este canal queda como el combo activo */
        });
      })();
      });
});
