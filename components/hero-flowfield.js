/**
 * Cero Studio · Hero flow-field background (kinetic brutalism, lime).
 *
 * Reutilizable: agrega <canvas data-flowfield></canvas> como primer hijo de
 * un contenedor posicionado (position:relative; overflow:hidden) y carga este
 * script con `defer`. Anima un campo de flujo de líneas lime/blancas —la misma
 * firma visual del hero del home (js/home.js)— dimensionado a su contenedor.
 *
 * - Respeta prefers-reduced-motion (pinta un frame estático y sale).
 * - Pausa la animación cuando el hero sale del viewport (IntersectionObserver).
 * - Cap de FPS (30 en mobile, 60 en desktop) para no castigar CPU/GPU.
 *
 * Uso: <script src="/components/hero-flowfield.js" defer></script>
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (!document.querySelectorAll || !window.requestAnimationFrame) return;

  function init() {
    var canvases = document.querySelectorAll('canvas[data-flowfield]');
    for (var i = 0; i < canvases.length; i++) initFlow(canvases[i]);
  }

  function initFlow(canvas) {
    var host = canvas.parentElement || canvas;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var W, H, t = 0, seeds = [], currentPoles = [], rafId = null, lastFrameTime = 0, frameInterval = 1000 / 60;

    var poles = [
      { fx: .18, fy: .28, q: 1 },
      { fx: .82, fy: .72, q: -1 },
      { fx: .55, fy: .12, q: 1 },
      { fx: .35, fy: .82, q: -1 },
      { fx: .74, fy: .24, q: 1 },
      { fx: .26, fy: .76, q: -1 },
      { fx: .50, fy: .50, q: 1 },
      { fx: .88, fy: .42, q: -1 },
    ];

    function resize() {
      var r = host.getBoundingClientRect();
      W = canvas.width = Math.max(1, Math.round(r.width));
      H = canvas.height = Math.max(1, Math.round(r.height));
    }

    function buildSeeds() {
      var isMobile = W < 768;
      var LINES = isMobile ? 50 : 110;
      seeds = [];
      for (var i = 0; i < LINES; i++) {
        var a = (i / LINES) * Math.PI * 2;
        var lime = Math.random() < (i % 4 === 0 ? .75 : .22);
        seeds.push({
          x: W * .5 + Math.cos(a) * W * .47,
          y: H * .5 + Math.sin(a) * H * .45,
          lime: lime,
          step: (isMobile ? 11 : 6) + Math.random() * 8,
          steps: (isMobile ? 70 : 140) + Math.floor(Math.random() * (isMobile ? 60 : 120)),
          drift: 30 + Math.random() * 55,
          driftSpd: .3 + Math.random() * .5,
          lw: lime ? .8 + Math.random() * 1.6 : .4 + Math.random() * .8,
          alpha: lime ? .26 + Math.random() * .24 : .07 + Math.random() * .11,
        });
      }
      for (var k = 0; k < poles.length; k++) {
        var p = poles[k];
        var innerLines = isMobile ? 3 : 6;
        for (var j = 0; j < innerLines; j++) {
          var aa = (j / innerLines) * Math.PI * 2;
          var lime2 = p.q > 0;
          seeds.push({
            x: p.fx * W + Math.cos(aa) * 90,
            y: p.fy * H + Math.sin(aa) * 90,
            lime: lime2,
            step: (isMobile ? 12 : 8) + Math.random() * 10,
            steps: (isMobile ? 50 : 100) + Math.floor(Math.random() * (isMobile ? 40 : 80)),
            drift: 15 + Math.random() * 35,
            driftSpd: .5 + Math.random() * .7,
            lw: lime2 ? 1.0 + Math.random() * 1.8 : .5 + Math.random() * .6,
            alpha: lime2 ? .32 + Math.random() * .28 : .06 + Math.random() * .10,
          });
        }
      }
    }

    function field(x, y) {
      var fx = 0, fy = 0;
      for (var i = 0; i < currentPoles.length; i++) {
        var p = currentPoles[i];
        var dx = x - p.px, dy = y - p.py;
        var d2 = dx * dx + dy * dy;
        var d = Math.sqrt(d2) + 1;
        var force = p.q / (d2 * .0008 + d);
        fx += dx * force;
        fy += dy * force;
      }
      var mag = Math.sqrt(fx * fx + fy * fy) + .0001;
      return { vx: fx / mag, vy: fy / mag };
    }

    function renderFrame() {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      t += .0085;

      currentPoles = poles.map(function (p) {
        return {
          px: p.fx * W + Math.sin(t * 1.1 + p.fy * 5) * 85,
          py: p.fy * H + Math.cos(t * .85 + p.fx * 5) * 72,
          q: p.q
        };
      });

      for (var s = 0; s < seeds.length; s++) {
        var seed = seeds[s];
        var drift = t * seed.driftSpd;
        var x = seed.x + Math.sin(drift + seed.x * .002) * seed.drift;
        var y = seed.y + Math.cos(drift * .8 + seed.y * .002) * seed.drift * .7;

        ctx.beginPath(); ctx.moveTo(x, y);
        for (var st = 0; st < seed.steps; st++) {
          var v = field(x, y);
          x += v.vx * seed.step;
          y += v.vy * seed.step;
          if (x < -80 || x > W + 80 || y < -80 || y > H + 80) break;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = seed.lime
          ? 'rgba(184,255,0,' + seed.alpha + ')'
          : 'rgba(255,255,255,' + seed.alpha + ')';
        ctx.lineWidth = seed.lw;
        ctx.stroke();
      }
    }

    function draw(now) {
      rafId = requestAnimationFrame(draw);
      if (now - lastFrameTime < frameInterval) return;
      lastFrameTime = now;
      renderFrame();
    }

    function rebuild() {
      resize();
      if (W < 2 || H < 2) return false; // layout aún no listo
      buildSeeds();
      frameInterval = 1000 / (W < 768 ? 30 : 60);
      if (prefersReducedMotion) renderFrame();
      return true;
    }

    function start() {
      var ready = rebuild();

      if (!prefersReducedMotion) {
        new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) {
            if (!rafId) { lastFrameTime = 0; rafId = requestAnimationFrame(draw); }
          } else if (rafId) {
            cancelAnimationFrame(rafId); rafId = null;
          }
        }, { threshold: 0 }).observe(host);
      }

      // ResizeObserver: dispara cuando el contenedor toma su tamaño real
      // (resuelve el caso "layout no listo al cargar") y en cada resize.
      var rt, lastW = W, lastH = H;
      if (window.ResizeObserver) {
        new ResizeObserver(function () {
          clearTimeout(rt);
          rt = setTimeout(function () {
            var r = host.getBoundingClientRect();
            var nw = Math.round(r.width), nh = Math.round(r.height);
            if (nw === lastW && nh === lastH) return;
            lastW = nw; lastH = nh;
            rebuild();
          }, 150);
        }).observe(host);
      } else {
        window.addEventListener('resize', function () {
          clearTimeout(rt);
          rt = setTimeout(function () { rebuild(); }, 200);
        });
      }

      // Reintento de respaldo si al cargar el contenedor medía ~0.
      if (!ready) setTimeout(rebuild, 150);
    }

    start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
