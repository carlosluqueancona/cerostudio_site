/* ═══════════════════════════════════════════════════════════════════════
   HERO FIELD — Web Worker (OffscreenCanvas)
   ─────────────────────────────────────────────────────────────────────
   Port 1:1 de la animación 'field' del hero (js/home.js): misma matemática,
   mismos parámetros visuales, densidad COMPLETA. Corre en un hilo aparte
   para que el main thread (cursor rAF, scroll, GSAP) nunca comparta
   presupuesto de frame con las ~250k evaluaciones de campo por render.

   DOS MODOS (según el init):
     render  — init trae canvas (OffscreenCanvas transferido): el worker
               calcula Y rasteriza. Chrome/Edge/Firefox.
     compute — init SIN canvas: el worker solo calcula y manda las
               polilíneas empacadas ({type:'frame', buf}) + los estilos
               ({type:'buckets'}); el main las traza. Safari/WebKit, donde
               el OffscreenCanvas 2D en worker rasteriza por software.

   PROTOCOLO (mensajes desde home.js):
     { type:'init', canvas?, w, h, reduced } canvas opcional (ver modos);
                                             reduced = prefers-reduced-motion:
                                             un solo frame estático, sin loop
     { type:'size', w, h }                   resize (en modo render el worker
                                             es dueño del canvas)
     { type:'vis',  visible }                hero en viewport Y pestaña visible:
                                             pausa/reanuda el loop
   ═══════════════════════════════════════════════════════════════════════ */
'use strict';

let canvas = null, ctx = null, mode = 'render';
let W = 0, H = 0, t = 0, seeds = [], reduced = false;
let decimate = 1;   /* modo compute: guardar 1 de cada N puntos (la física avanza igual) */
let dpr = 1;        /* modo render: devicePixelRatio del main (el worker no lo conoce) */

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
  if (!canvas) return;   /* modo 'compute': el canvas lo dimensiona el main */
  /* Nitidez Retina: DPR hasta 2× en desktop (el costo extra vive en este
     hilo, el main no se entera). Mobile a 1× CSS — pantallas chicas +
     DPR 3 dispararían el raster sin ganancia visible con líneas difusas. */
  const RES = W < 768 ? 1 : Math.min(dpr, 2);
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

/* Avanza la simulación un paso y devuelve las polilíneas por cubeta.
   Compartido por los dos modos: 'render' las traza aquí mismo, 'compute'
   las empaca y las manda al main thread. */
function computePolylines() {
  t += .0085;  // ~2× faster time than hero3 (.004)

  currentPoles = poles.map(p => ({
    px: p.fx * W + Math.sin(t * 1.1 + p.fy * 5) * 85,
    py: p.fy * H + Math.cos(t * .85 + p.fx * 5) * 72,
    q: p.q
  }));

  const byBucket = BUCKETS.map(() => []);
  for (const seed of seeds) {
    const drift = t * seed.driftSpd;
    let x = seed.x + Math.sin(drift + seed.x * .002) * seed.drift;
    let y = seed.y + Math.cos(drift * .8 + seed.y * .002) * seed.drift * .7;

    const pts = [x, y];
    for (let s = 0; s < seed.steps; s++) {
      const { vx, vy } = field(x, y);
      x += vx * seed.step;
      y += vy * seed.step;
      if (x < -80 || x > W + 80 || y < -80 || y > H + 80) break;
      if (s % decimate === 0) pts.push(x, y);
    }
    byBucket[seed.bucket].push(pts);
  }
  return byBucket;
}

function renderFrame() {
  const byBucket = computePolylines();
  ctx.clearRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter';

  for (let i = 0; i < BUCKETS.length; i++) {
    const lines = byBucket[i];
    if (!lines.length) continue;
    const p = new Path2D();
    for (const pts of lines) {
      p.moveTo(pts[0], pts[1]);
      for (let j = 2; j < pts.length; j += 2) p.lineTo(pts[j], pts[j + 1]);
    }
    const b = BUCKETS[i];
    ctx.strokeStyle = b.lime
      ? `rgba(178,247,0,${b.alpha})`
      : `rgba(255,255,255,${b.alpha})`;
    ctx.lineWidth = b.lw;
    ctx.stroke(p);
  }
}

/* Modo 'compute': empaca las polilíneas en un Float32Array transferible.
   Formato: [nBuckets, por cubeta: nLíneas, por línea: nPuntos, x,y…] */
function postFrame() {
  const byBucket = computePolylines();
  let n = 1;
  for (const lines of byBucket) {
    n += 1;
    for (const pts of lines) n += 1 + pts.length;
  }
  const buf = new Float32Array(n);
  let o = 0;
  buf[o++] = byBucket.length;
  for (const lines of byBucket) {
    buf[o++] = lines.length;
    for (const pts of lines) {
      buf[o++] = pts.length / 2;
      buf.set(pts, o);
      o += pts.length;
    }
  }
  postMessage({ type: 'frame', buf: buf.buffer }, [buf.buffer]);
}

function tick() {
  if (mode === 'render') renderFrame(); else postFrame();
}

/* ── Loop a 30 fps con setInterval ──────────────────────────────────────
   OJO: NO usamos requestAnimationFrame aquí. El rAF de un worker con
   OffscreenCanvas transferido queda estrangulado en Chrome en ciertas
   configuraciones (llegamos a medir ~1 frame cada 4-5s con renderFrame
   costando solo ~21ms). Los timers de un dedicated worker sí disparan a
   ritmo estable; el main thread nos pausa vía 'vis' cuando el hero sale
   del viewport o la pestaña se oculta. */
let frameMs = 1000 / 30;   /* modo compute puede pedir otro fps vía init */
let timerId = null, inited = false;

function start() {
  if (!timerId && !reduced && inited) timerId = setInterval(tick, frameMs);
}
function stop() {
  if (timerId) { clearInterval(timerId); timerId = null; }
}

onmessage = function (e) {
  const m = e.data;
  if (m.type === 'init') {
    mode = m.canvas ? 'render' : 'compute';
    if (m.canvas) {
      canvas = m.canvas;
      ctx = canvas.getContext('2d');
    }
    reduced = !!m.reduced;
    if (m.fps) frameMs = 1000 / m.fps;
    decimate = m.decimate || 1;
    dpr = m.dpr || 1;
    setSize(m.w, m.h);
    buildSeeds();
    if (mode === 'compute') postMessage({ type: 'buckets', buckets: BUCKETS });
    inited = true;
    tick();   /* primer frame inmediato (y único si reduced) */
  } else if (m.type === 'size') {
    if (!inited) return;
    if (m.dpr) dpr = m.dpr;
    setSize(m.w, m.h);
    buildSeeds();
    if (reduced) tick();
  } else if (m.type === 'vis') {
    if (m.visible) start(); else stop();
  }
};
