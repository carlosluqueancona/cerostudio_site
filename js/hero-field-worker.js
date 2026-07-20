/* ═══════════════════════════════════════════════════════════════════════
   HERO FIELD — Web Worker (OffscreenCanvas)
   ─────────────────────────────────────────────────────────────────────
   Port 1:1 de la animación 'field' del hero (js/home.js): misma matemática,
   mismos parámetros visuales, densidad COMPLETA. Corre en un hilo aparte
   para que el main thread (cursor rAF, scroll, GSAP) nunca comparta
   presupuesto de frame con las ~250k evaluaciones de campo por render.

   PROTOCOLO (mensajes desde home.js):
     { type:'init', canvas, w, h, reduced }  canvas transferido + tamaño
                                             (reduced = prefers-reduced-motion:
                                              un solo frame estático, sin loop)
     { type:'size', w, h }                   resize — el worker es dueño del
                                             canvas, el main ya no puede tocarlo
     { type:'vis',  visible }                IntersectionObserver del hero:
                                             pausa/reanuda el loop
   ═══════════════════════════════════════════════════════════════════════ */
'use strict';

let canvas = null, ctx = null;
let W = 0, H = 0, t = 0, seeds = [], reduced = false;

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
let currentPoles = [];

/* Cubetas de estilo: las polilíneas se acumulan en un Path2D por cubeta y se
   trazan en ≤6 stroke() por frame en vez de uno por línea. */
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

function setSize(w, h) {
  W = w; H = h;
  /* Backing store a 0.7× en desktop (las líneas difusas no lo delatan);
     mobile a 1× — ya corre a resolución CSS sin DPR. */
  const RES = W < 768 ? 1 : 0.7;
  canvas.width = Math.round(W * RES);
  canvas.height = Math.round(H * RES);
  ctx.setTransform(RES, 0, 0, RES, 0, 0);
}

function buildSeeds() {
  const isMobile = W < 768;
  const LINES = isMobile ? 60 : 130;  // more lines for density
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
      step: (isMobile ? 11 : 6) + Math.random() * 8,          // 6–14 px per step
      steps: (isMobile ? 70 : 140) + Math.floor(Math.random() * (isMobile ? 60 : 120)), // 140–260 steps
      drift: 30 + Math.random() * 55,         // drift amplitude 30–85px
      driftSpd: .3 + Math.random() * .5,     // drift speed per seed
      lw: lime ? .8 + Math.random() * 1.6 : .4 + Math.random() * .8,
      alpha: lime ? .28 + Math.random() * .25 : .08 + Math.random() * .12,
    });
  }

  // Extra seeds near each pole for chaotic density
  for (const p of poles) {
    const innerLines = isMobile ? 3 : 6;
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

/* ── Loop a 30 fps con setInterval ──────────────────────────────────────
   OJO: NO usamos requestAnimationFrame aquí. El rAF de un worker con
   OffscreenCanvas transferido queda estrangulado en Chrome en ciertas
   configuraciones (llegamos a medir ~1 frame cada 4-5s con renderFrame
   costando solo ~21ms). Los timers de un dedicated worker sí disparan a
   ritmo estable; el main thread nos pausa vía 'vis' cuando el hero sale
   del viewport o la pestaña se oculta. */
const frameInterval = 1000 / 30;
let timerId = null;

function start() {
  if (!timerId && !reduced && canvas) timerId = setInterval(renderFrame, frameInterval);
}
function stop() {
  if (timerId) { clearInterval(timerId); timerId = null; }
}

onmessage = function (e) {
  const m = e.data;
  if (m.type === 'init') {
    canvas = m.canvas;
    ctx = canvas.getContext('2d');
    reduced = !!m.reduced;
    setSize(m.w, m.h);
    buildSeeds();
    renderFrame();   /* primer frame inmediato (y único si reduced) */
  } else if (m.type === 'size') {
    if (!canvas) return;
    setSize(m.w, m.h);
    buildSeeds();
    if (reduced) renderFrame();
  } else if (m.type === 'vis') {
    if (m.visible) start(); else stop();
  }
};
