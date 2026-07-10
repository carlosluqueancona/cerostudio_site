/**
 * POST /api/contact
 * Recibe el formulario de contacto público.
 * - Guarda en D1 (contact_submissions)
 * - Envía notificación por email via Resend API (env.RESEND_API_KEY)
 *
 * Configuración requerida en Cloudflare Pages → Settings → Environment variables:
 *   RESEND_API_KEY = re_xxxxxxxxxxxx   (obtenido en resend.com)
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

const DEST_EMAIL = 'cerostudiomx@gmail.com';
const FROM_EMAIL = 'noreply@cerostudio.ai';

// ── Rate limit ────────────────────────────────────────────────────────────────
// Primera línea: contador en memoria por isolate (barato, se evade entre PoPs).
// Segunda línea: conteos en D1 sobre contact_submissions (sin cambiar schema).
const _ipHits = new Map(); // ip -> [timestamps]

function ipLimited(ip) {
  const now = Date.now(), WINDOW = 5 * 60 * 1000, MAX = 3;
  const hits = (_ipHits.get(ip) || []).filter(t => now - t < WINDOW);
  hits.push(now);
  if (_ipHits.size > 5000) _ipHits.clear(); // cota de memoria del isolate
  _ipHits.set(ip, hits);
  return hits.length > MAX;
}

async function d1Limited(env, email) {
  const hourAgo   = new Date(Date.now() - 3600e3).toISOString();
  const tenMinAgo = new Date(Date.now() - 600e3).toISOString();
  const [byEmail, global] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) AS n FROM contact_submissions WHERE email = ? AND created_at > ?')
      .bind(email, hourAgo).first(),
    env.DB.prepare('SELECT COUNT(*) AS n FROM contact_submissions WHERE created_at > ?')
      .bind(tenMinAgo).first(),
  ]);
  return (byEmail?.n ?? 0) >= 3 || (global?.n ?? 0) >= 10;
}

// ── Turnstile (mismo patrón que el intake worker) ─────────────────────────────
// Si TURNSTILE_SECRET_KEY no está configurada en Pages, se salta la verificación
// (no rompe el form). Al configurarla, el form debe mandar cf_turnstile_response.
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

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';

  try {
    const body = await request.json();
    const { nombre, email, empresa, servicio, mensaje, _gotcha,
            event_id, consent, fbp, fbc, page_url } = body;

    // Honeypot — bots rellenan este campo
    if (_gotcha) return json({ ok: true }, 200, origin);

    // Validación
    if (!nombre?.trim())  return json({ error: 'El nombre es requerido' }, 400, origin);
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return json({ error: 'Email inválido' }, 400, origin);
    if (!mensaje?.trim()) return json({ error: 'El mensaje es requerido' }, 400, origin);

    // Límites de tamaño — evita payloads gigantes hacia D1/Resend
    if (nombre.length > 200 || email.length > 254 || (empresa?.length ?? 0) > 200 ||
        (servicio?.length ?? 0) > 50 || mensaje.length > 5000)
      return json({ error: 'El mensaje excede el tamaño permitido' }, 400, origin);

    // Campos de tracking (Meta CAPI): son metadata, NUNCA deben bloquear el lead.
    // Si vienen sobredimensionados (p.ej. fbclid largo en tráfico pagado) se ignoran
    // en vez de rechazar el envío — el core (D1/Resend/CAPI) siempre corre.
    const trk = {
      event_id: (typeof event_id === 'string' && event_id.length <= 64)  ? event_id : '',
      fbp:      (typeof fbp === 'string'      && fbp.length <= 128)       ? fbp      : '',
      fbc:      (typeof fbc === 'string'      && fbc.length <= 512)       ? fbc      : '',
      page_url: (typeof page_url === 'string' && page_url.length <= 500)  ? page_url : '',
    };

    // Anti-spam: Turnstile (si está configurado) + rate limit
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!(await verifyTurnstile(body.cf_turnstile_response || '', env, ip)))
      return json({ error: 'Verificación anti-bot fallida. Recarga la página.' }, 403, origin);
    if (ipLimited(ip) || (await d1Limited(env, email.trim().toLowerCase())))
      return json({ error: 'Demasiados envíos. Intenta de nuevo en unos minutos.' }, 429, origin);

    const now = new Date().toISOString();

    // Guardar en D1
    await env.DB.prepare(`
      INSERT INTO contact_submissions (nombre, email, empresa, servicio, mensaje, leido, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).bind(
      nombre.trim(),
      email.trim().toLowerCase(),
      empresa?.trim()  || '',
      servicio?.trim() || '',
      mensaje.trim(),
      now
    ).run();

    // Meta Conversions API (server-side) — no-op total sin las env configuradas.
    // Solo con consentimiento EXPLÍCITO: el evento Lead lleva PII hasheada
    // (email/nombre) + IP + User-Agent, así que sin 'accepted' no se envía nada
    // a Meta (coincide con la política de privacidad publicada).
    // TEMP DEBUG (retirar tras validar CAPI): deja rastro del gate en site_cache.
    const capiGate = !env.META_PIXEL_ID ? 'skip:no-pixel-id'
      : !env.META_CAPI_TOKEN ? 'skip:no-token'
      : consent !== 'accepted' ? 'skip:consent=' + String(consent)
      : 'queued';
    context.waitUntil?.(env.DB.prepare(
      "INSERT INTO site_cache (key, value, updated_at) VALUES ('meta_capi_gate', ?, datetime('now')) " +
      "ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at"
    ).bind(capiGate).run().catch(() => {}));

    if (env.META_PIXEL_ID && env.META_CAPI_TOKEN && consent === 'accepted') {
      context.waitUntil?.(sendMetaLead(env, {
        eventId: trk.event_id || crypto.randomUUID(),
        email,
        nombre,
        formType: servicio?.trim() || 'contacto',
        ip,
        ua: request.headers.get('User-Agent') || '',
        fbp: trk.fbp,
        fbc: trk.fbc,
        sourceUrl: sanitizeSourceUrl(trk.page_url) ||
                   sanitizeSourceUrl(request.headers.get('Referer')) ||
                   'https://cerostudio.ai/',
      }).catch(err => console.error('[contact] Meta CAPI error:', err.message)));
    }

    // Enviar email de notificación
    if (env.RESEND_API_KEY) {
      try {
        await sendNotification(env, { nombre, email, empresa, servicio, mensaje, now });
      } catch (err) {
        // El mensaje ya está guardado — no fallar la request si el email falla
        console.error('[contact] Email send error:', err.message);
      }
    }

    return json({ ok: true }, 200, origin);
  } catch (e) {
    console.error('[contact] Error:', e.message);
    return json({ error: 'Error interno del servidor' }, 500, origin);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

async function sendNotification(env, { nombre, email, empresa, servicio, mensaje, now }) {
  const fecha = new Date(now).toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const servicioLabels = {
    web:           'Desarrollo Web',
    ecommerce:     'Tienda eCommerce',
    branding:      'Branding Digital',
    seo:           'SEO & Visibilidad',
    mantenimiento: 'Mantenimiento',
    consultoria:   'Consultoría Digital',
    'auditoria-gratis': 'Auditoría exprés GRATIS (lead magnet)',
    otro:          'Otro',
  };

  const text = [
    `Nuevo mensaje desde el formulario de contacto de cerostudio.ai`,
    ``,
    `Nombre:    ${nombre}`,
    `Email:     ${email}`,
    `Empresa:   ${empresa || '—'}`,
    `Servicio:  ${servicioLabels[servicio] || servicio || '—'}`,
    `Fecha:     ${fecha}`,
    ``,
    `Mensaje:`,
    `----------`,
    mensaje,
    `----------`,
    ``,
    `Responder directamente a: ${email}`,
    `Ver en el admin: https://cerostudio.ai/blog/admin/`,
  ].join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Cero Studio <${FROM_EMAIL}>`,
      to: [DEST_EMAIL],
      reply_to: email,
      subject: `Nuevo mensaje de ${nombre} — Cero Studio`,
      text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error ${res.status}: ${err}`);
  }
}

// ── Meta Conversions API ──────────────────────────────────────────────────────
// Solo se dispara si META_PIXEL_ID + META_CAPI_TOKEN están en el entorno Y el
// usuario aceptó cookies (el gating de consentimiento vive en onRequestPost,
// porque el evento entero lleva PII hasheada + IP + UA).

// Acepta la URL solo si viene de nuestro propio dominio; si no, cadena vacía.
// Se parsea con URL y se compara el hostname EXACTO — startsWith dejaba pasar
// hosts como 'cerostudio.ai.evil.com'. Se usa también para el fallback Referer.
function sanitizeSourceUrl(u) {
  if (typeof u !== 'string' || !u) return '';
  try {
    const { protocol, hostname } = new URL(u);
    if (protocol === 'https:' &&
        (hostname === 'cerostudio.ai' || hostname === 'www.cerostudio.ai'))
      return u;
  } catch { /* URL inválida → se descarta */ }
  return '';
}

async function sha256Hex(s) {
  const data = new TextEncoder().encode(String(s).trim().toLowerCase());
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sendMetaLead(env, p) {
  // Meta normaliza `fn` como PRIMER nombre y `ln` como apellido; el campo del
  // form trae el nombre completo, así que se separa para no degradar el match.
  const parts = String(p.nombre).trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName  = parts.slice(1).join(' ');

  const user_data = {
    em: [await sha256Hex(p.email)],
    fn: [await sha256Hex(firstName)],
    client_ip_address: p.ip,
    client_user_agent: p.ua,
  };
  if (lastName) user_data.ln = [await sha256Hex(lastName)];

  // Cookies de Meta (fbp/fbc): el consentimiento ya se validó en onRequestPost.
  if (p.fbp) user_data.fbp = p.fbp;
  if (p.fbc) user_data.fbc = p.fbc;

  const body = {
    data: [{
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: p.eventId,
      action_source: 'website',
      event_source_url: p.sourceUrl,
      user_data,
      custom_data: { form_type: p.formType },
    }],
  };

  if (env.META_TEST_EVENT_CODE) body.test_event_code = env.META_TEST_EVENT_CODE;

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${env.META_PIXEL_ID}/events?access_token=${env.META_CAPI_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  const resText = await res.text();
  if (!res.ok) console.error('[contact] Meta CAPI', res.status, resText);

  // TEMP DEBUG (retirar tras validar CAPI): respuesta de Graph API en site_cache.
  // El error de un token inválido dice "Invalid OAuth access token" SIN exponer el token.
  await env.DB.prepare(
    "INSERT INTO site_cache (key, value, updated_at) VALUES ('meta_capi_last', ?, datetime('now')) " +
    "ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at"
  ).bind(res.status + ' ' + resText.slice(0, 500)).run().catch(() => {});
}
