/**
 * GET /recursos/archivos/<archivo>
 * Sirve el archivo estático del recurso Y cuenta la descarga server-side.
 *
 * Por qué existe: la medición del navegador (GA4/Pixel vía GTM) está gateada al
 * banner de cookies, así que subcuenta — el 17-jul-2026 el primer prospecto real
 * (Omar) descargó la guía y fue invisible para GA4. Este conteo no usa cookies ni
 * identifica personas: registra la petición (slug, canal UTM, país, dispositivo),
 * como un log de servidor. Fuente de verdad COMPLETA de descargas.
 *
 * CAPI: el evento DescargaGuia solo se envía a Meta si la página de origen marcó
 * consentimiento aceptado (query c=1, la añade js/recursos.js al hacer clic) —
 * misma política que /api/contact. El event_id (eid) dedupe contra el evento del
 * pixel del navegador que dispara GTM con ese mismo id.
 */

let tableReady = false;

async function ensureTable(env) {
  if (tableReady) return;
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS descargas_recursos (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      slug         TEXT NOT NULL,
      created_at   TEXT NOT NULL,
      utm_source   TEXT DEFAULT '',
      utm_medium   TEXT DEFAULT '',
      utm_campaign TEXT DEFAULT '',
      utm_content  TEXT DEFAULT '',
      referer      TEXT DEFAULT '',
      country      TEXT DEFAULT '',
      device       TEXT DEFAULT '',
      ua           TEXT DEFAULT '',
      consent      INTEGER DEFAULT 0,
      event_id     TEXT DEFAULT ''
    )
  `).run();
  tableReady = true;
}

const BOT_RE = /bot|crawler|spider|crawling|facebookexternalhit|whatsapp|telegram|slurp|bingpreview|headless/i;

// Solo URLs de nuestro dominio (mismo criterio que /api/contact).
function sanitizeSourceUrl(u) {
  if (typeof u !== 'string' || !u) return '';
  try {
    const { protocol, hostname } = new URL(u);
    if (protocol === 'https:' &&
        (hostname === 'cerostudio.ai' || hostname === 'www.cerostudio.ai'))
      return u;
  } catch { /* inválida */ }
  return '';
}

function getCookie(header, name) {
  const m = (header || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? m[1] : '';
}

async function sendMetaDescarga(env, p) {
  const user_data = {
    client_ip_address: p.ip,
    client_user_agent: p.ua,
  };
  if (p.fbp) user_data.fbp = p.fbp;
  if (p.fbc) user_data.fbc = p.fbc;

  const body = {
    data: [{
      event_name: 'DescargaGuia',
      event_time: Math.floor(Date.now() / 1000),
      event_id: p.eventId,
      action_source: 'website',
      event_source_url: p.sourceUrl || 'https://cerostudio.ai/recursos/',
      user_data,
      custom_data: { recurso: p.slug, origen: 'server' },
    }],
  };
  if (env.META_TEST_EVENT_CODE) body.test_event_code = env.META_TEST_EVENT_CODE;

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${env.META_PIXEL_ID}/events?access_token=${env.META_CAPI_TOKEN}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  if (!res.ok) console.error('[descargas] Meta CAPI', res.status, await res.text());
}

export async function onRequestGet(context) {
  const { request, env, params } = context;

  // 1) Servir el archivo estático tal cual (ASSETS no re-ejecuta Functions).
  const asset = await env.ASSETS.fetch(request);

  // 2) Contar solo descargas reales de PDF que existieron.
  const archivo = String(params.archivo || '');
  const ua = request.headers.get('User-Agent') || '';
  if (!asset.ok || !archivo.endsWith('.pdf') || BOT_RE.test(ua)) return asset;

  const url = new URL(request.url);
  const referer = request.headers.get('Referer') || '';
  const slug = archivo.replace(/\.pdf$/, '');

  // UTM: primero de la propia URL del PDF; si no, heredado de la página origen.
  let utm = {};
  try {
    const refURL = referer ? new URL(referer) : null;
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) {
      utm[k] = url.searchParams.get(k) || (refURL && refURL.searchParams.get(k)) || '';
    }
  } catch { utm = { utm_source: '', utm_medium: '', utm_campaign: '', utm_content: '' }; }

  const device = /Mobile|Android|iPhone|iPad/i.test(ua) ? 'mobile' : 'desktop';
  const country = (request.cf && request.cf.country) || request.headers.get('CF-IPCountry') || '';
  const consent = url.searchParams.get('c') === '1';
  const eventId = (url.searchParams.get('eid') || '').slice(0, 64);

  const log = async () => {
    try {
      await ensureTable(env);
      await env.DB.prepare(`
        INSERT INTO descargas_recursos
          (slug, created_at, utm_source, utm_medium, utm_campaign, utm_content, referer, country, device, ua, consent, event_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        slug,
        new Date().toISOString(),
        utm.utm_source.slice(0, 100),
        utm.utm_medium.slice(0, 100),
        utm.utm_campaign.slice(0, 100),
        utm.utm_content.slice(0, 100),
        referer.slice(0, 500),
        country,
        device,
        ua.slice(0, 300),
        consent ? 1 : 0,
        eventId
      ).run();
    } catch (e) {
      console.error('[descargas] D1 error:', e.message);
    }

    // CAPI solo con consentimiento explícito de la página origen.
    if (consent && env.META_PIXEL_ID && env.META_CAPI_TOKEN) {
      const cookies = request.headers.get('Cookie') || '';
      await sendMetaDescarga(env, {
        eventId: eventId || crypto.randomUUID(),
        slug,
        ip: request.headers.get('CF-Connecting-IP') || '',
        ua,
        fbp: getCookie(cookies, '_fbp'),
        fbc: getCookie(cookies, '_fbc'),
        sourceUrl: sanitizeSourceUrl(referer),
      }).catch(e => console.error('[descargas] CAPI error:', e.message));
    }
  };

  context.waitUntil ? context.waitUntil(log()) : await log();
  return asset;
}
