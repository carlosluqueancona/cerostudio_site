/**
 * POST /api/ia
 * Simulador de AI Search (/ia/ y /en/ai/): le pregunta a un modelo de Workers AI
 * por una recomendación local y diagnostica qué le falta al negocio para que
 * la IA lo nombre. No guarda nada en D1 — la captura del lead la hace /api/contact.
 *
 * Body JSON: { negocio, giro, ciudad, lang: 'es'|'en', turnstile }
 * Respuesta:  { ok, mentioned, answer, findings: [3 strings], model }
 *
 * Requiere el binding Workers AI (wrangler.jsonc → "ai": { "binding": "AI" }).
 * Si no existe, responde 503 con mensaje claro.
 */

const ALLOWED_ORIGINS = ['https://cerostudio.ai', 'https://www.cerostudio.ai'];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

const MODEL = '@cf/meta/llama-3.1-8b-instruct';
const MODEL_LABEL = 'Llama 3.1 8B · Cloudflare Workers AI';
const MAX_TOKENS = 350;
const AI_TIMEOUT_MS = 30000; // dos llamadas en paralelo; Workers AI suele tardar 2–8 s

// Mensajes de error ES/EN
const MSG = {
  es: {
    invalid:   'Revisa los tres datos: nombre del negocio, giro y ciudad (máx. 80 caracteres, sin HTML).',
    turnstile: 'Verificación anti-bot fallida. Recarga la página.',
    limited:   'Demasiadas consultas. Intenta de nuevo en unos minutos.',
    noai:      'El simulador no está disponible en este momento (Workers AI sin configurar).',
    timeout:   'La IA tardó demasiado en responder. Intenta de nuevo.',
    failed:    'Algo falló al consultar a la IA. Intenta de nuevo.',
  },
  en: {
    invalid:   'Check the three fields: business name, category and city (max. 80 characters, no HTML).',
    turnstile: 'Anti-bot verification failed. Reload the page.',
    limited:   'Too many requests. Try again in a few minutes.',
    noai:      'The simulator is unavailable right now (Workers AI not configured).',
    timeout:   'The AI took too long to answer. Try again.',
    failed:    'Something failed while asking the AI. Try again.',
  },
};

// Hallazgos de respaldo si el modelo no devuelve una lista parseable
const FALLBACK = {
  es: [
    'Entidad/NAP: publica nombre, dirección y teléfono idénticos en tu sitio, Google Business Profile y directorios; la IA cruza esas fuentes.',
    'Contenido citable: una página por servicio que responda en 2–3 frases claras qué haces, para quién y en qué zona.',
    'Schema + llms.txt: marca LocalBusiness/Organization con JSON-LD y publica un llms.txt que resuma tu negocio para los crawlers de IA.',
  ],
  en: [
    'Entity/NAP: publish the exact same name, address and phone on your site, Google Business Profile and directories; AI cross-checks them.',
    'Citable content: one page per service that answers in 2–3 clear sentences what you do, for whom and in which area.',
    'Schema + llms.txt: mark up LocalBusiness/Organization with JSON-LD and publish an llms.txt that summarizes your business for AI crawlers.',
  ],
};

// ── Rate limit (mismo patrón que contact.js: contador por isolate) ───────────
const _ipHits = new Map(); // ip -> [timestamps]
const _allHits = [];       // cota global por isolate: acota el gasto de Workers AI

function ipLimited(ip) {
  const now = Date.now(), WINDOW = 5 * 60 * 1000, MAX = 5;
  const hits = (_ipHits.get(ip) || []).filter(t => now - t < WINDOW);
  hits.push(now);
  if (_ipHits.size > 5000) _ipHits.clear(); // cota de memoria del isolate
  _ipHits.set(ip, hits);
  return hits.length > MAX;
}

function globalLimited() {
  const now = Date.now(), WINDOW = 10 * 60 * 1000, MAX = 120;
  while (_allHits.length && now - _allHits[0] > WINDOW) _allHits.shift();
  _allHits.push(now);
  return _allHits.length > MAX;
}

// ── Turnstile (idéntico a contact.js) ────────────────────────────────────────
async function verifyTurnstile(token, env, ip) {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: ip }),
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
// Campo de texto corto: string, 2–80 chars, sin etiquetas HTML ni saltos de línea
function cleanField(v) {
  if (typeof v !== 'string') return null;
  const s = v.replace(/\s+/g, ' ').trim();
  if (s.length < 2 || s.length > 80) return null;
  if (/[<>]/.test(s)) return null;
  return s;
}

// Normaliza para comparar: sin acentos, minúsculas, un solo espacio
function norm(s) {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function runModel(env, system, user) {
  const out = await env.AI.run(MODEL, {
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    max_tokens: MAX_TOKENS,
  });
  if (typeof out === 'string') return out.trim();
  return String(out?.response ?? '').trim();
}

// Convierte la respuesta del diagnóstico en exactamente 3 strings
function parseFindings(text, lang) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map(l => l.replace(/^\s*(?:[-•*–]|\d+[.)])\s*/, '').replace(/\*\*/g, '').trim())
    .filter(l => l.length > 12 && !/[:：]$/.test(l));
  const out = lines.slice(0, 3);
  const fb = FALLBACK[lang];
  for (let i = out.length; i < 3; i++) out.push(fb[i]);
  return out;
}

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';
  let lang = 'es';

  try {
    const body = await request.json().catch(() => ({}));
    lang = body.lang === 'en' ? 'en' : 'es';
    const t = MSG[lang];

    const negocio = cleanField(body.negocio);
    const giro    = cleanField(body.giro);
    const ciudad  = cleanField(body.ciudad);
    if (!negocio || !giro || !ciudad) return json({ ok: false, error: t.invalid }, 400, origin);

    // Anti-spam: Turnstile (si está configurado) + rate limit por IP + cota global
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!(await verifyTurnstile(body.turnstile || '', env, ip)))
      return json({ ok: false, error: t.turnstile }, 403, origin);
    if (ipLimited(ip) || globalLimited())
      return json({ ok: false, error: t.limited }, 429, origin);

    if (!env.AI || typeof env.AI.run !== 'function')
      return json({ ok: false, error: t.noai }, 503, origin);

    const idioma = lang === 'en' ? 'English' : 'español';

    // (a) Respuesta "hoy": un asistente genérico recomendando en la ciudad
    const sysAnswer = `Eres un asistente de IA general. Responde en ${idioma} de forma breve y natural.`;
    const userAnswer = lang === 'en'
      ? `Recommend a ${giro} in ${ciudad}. Give me 3 options with one line each.`
      : `Recomiéndame un ${giro} en ${ciudad}. Dame 3 opciones con una línea cada una.`;

    // (b) Diagnóstico: consultor de SEO + AI Search de Cero Studio
    const sysFindings = `Eres consultor de SEO y AI Search (AEO/GEO) de Cero Studio; responde en ${idioma}, tuteo, sin promesas de posiciones.`;
    const userFindings = lang === 'en'
      ? `The business '${negocio}' (${giro}, ${ciudad}) does not appear in AI assistant answers. Write exactly 3 concrete, actionable findings (max. 25 words each) about what it lacks for AI to understand and recommend it: entity/NAP, citable content, schema/llms.txt. Format: list with dashes.`
      : `El negocio '${negocio}' (${giro}, ${ciudad}) no aparece en las respuestas de asistentes de IA. Escribe exactamente 3 hallazgos concretos y accionables (máx. 25 palabras cada uno) sobre qué le falta para que la IA lo entienda y lo recomiende: entidad/NAP, contenido citable, schema/llms.txt. Formato: lista con guiones.`;

    let answer, findingsRaw;
    try {
      [answer, findingsRaw] = await withTimeout(Promise.all([
        runModel(env, sysAnswer, userAnswer),
        runModel(env, sysFindings, userFindings),
      ]), AI_TIMEOUT_MS);
    } catch (err) {
      const isTimeout = err && err.message === 'timeout';
      console.error('[ia] Workers AI', isTimeout ? 'timeout' : (err?.message || err));
      return json({ ok: false, error: isTimeout ? t.timeout : t.failed }, isTimeout ? 504 : 500, origin);
    }

    // Texto plano para la ventana de chat: sin negritas ni encabezados markdown
    answer = String(answer).replace(/\*\*/g, '').replace(/^#+\s*/gm, '').trim();
    if (!answer) return json({ ok: false, error: t.failed }, 500, origin);

    const mentioned = norm(answer).includes(norm(negocio));

    return json({
      ok: true,
      mentioned,
      answer,
      findings: parseFindings(findingsRaw, lang),
      model: MODEL_LABEL,
    }, 200, origin);

  } catch (err) {
    console.error('[ia] Error:', err);
    return json({ ok: false, error: MSG[lang].failed }, 500, origin);
  }
}
