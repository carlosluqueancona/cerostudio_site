/**
 * POST /api/admin/login
 * Body: { username, password }
 * Returns: { token } | { error }
 *
 * Required Cloudflare secrets (wrangler secret put):
 *   ADMIN_USERNAME
 *   ADMIN_PASSWORD
 *   JWT_SECRET
 */

const ALLOWED_ORIGINS = ['https://cerostudio.ai', 'https://www.cerostudio.ai'];

// ── Rate limiting: 5 login attempts per IP per 15 minutes ───────────────────
const LOGIN_RATE_LIMIT_WINDOW = 15 * 60_000; // 15 minutes
const LOGIN_RATE_LIMIT_MAX = 5;

function checkLoginRateLimit(ip) {
  if (!ip) return false;
  if (!globalThis._loginRateLimits) globalThis._loginRateLimits = new Map();
  const now = Date.now();
  const entry = globalThis._loginRateLimits.get(ip);
  if (!entry || now - entry.start > LOGIN_RATE_LIMIT_WINDOW) {
    globalThis._loginRateLimits.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count++;
  return entry.count > LOGIN_RATE_LIMIT_MAX;
}

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';

  if (!env.JWT_SECRET) {
    console.error('[login] JWT_SECRET no configurado');
    return json({ error: 'Error interno del servidor' }, 500, origin);
  }

  // Rate limit login attempts
  const clientIP = request.headers.get('CF-Connecting-IP') || '';
  if (checkLoginRateLimit(clientIP)) {
    return json({ error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' }, 429, origin);
  }

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return json({ error: 'Credenciales requeridas' }, 400, origin);
    }

    const validUser = timingSafeEqual(username, env.ADMIN_USERNAME || '');
    const validPass = timingSafeEqual(password, env.ADMIN_PASSWORD || '');

    if (!validUser || !validPass) {
      await new Promise(r => setTimeout(r, 500));
      return json({ error: 'Usuario o contraseña incorrectos' }, 401, origin);
    }

    const token = await signJWT(
      { sub: username, iat: Date.now(), exp: Date.now() + 86_400_000 }, // 24 h
      env.JWT_SECRET
    );

    // Set httpOnly cookie — invisible to JavaScript, survives XSS
    const cookie = [
      `cs_admin_jwt=${token}`,
      'HttpOnly',
      'Secure',
      'SameSite=Strict',
      'Path=/api/admin',
      'Max-Age=86400',
    ].join('; ');

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
        ...corsHeaders(origin),
      },
    });
  } catch (e) {
    console.error('[login] Error:', e.message);
    return json({ error: 'Error interno del servidor' }, 500, origin);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

function timingSafeEqual(a, b) {
  const la = a.length, lb = b.length;
  let diff = la ^ lb;
  const len = Math.max(la, lb);
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

async function signJWT(payload, secret) {
  const enc = new TextEncoder();
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = b64url(JSON.stringify(payload));
  const data   = `${header}.${body}`;

  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return `${data}.${b64url(String.fromCharCode(...new Uint8Array(sig)))}`;
}

function b64url(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
