/**
 * POST /api/admin/login
 * Body: { username, password }
 * Returns: { ok: true } + httpOnly cookie, or { error }
 *
 * Required Cloudflare secrets (wrangler secret put):
 *   ADMIN_USERNAME
 *   ADMIN_PASSWORD
 *   JWT_SECRET
 */

import { corsHeaders, json, signJWT } from './_shared.js';

const LOGIN_METHODS = 'POST, OPTIONS';

// ── Rate limiting: 5 login attempts per IP per 15 minutes ───────────────────
const LOGIN_RATE_LIMIT_WINDOW = 15 * 60_000; // 15 minutes
const LOGIN_RATE_LIMIT_MAX    = 5;

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

function timingSafeEqual(a, b) {
  const la = a.length, lb = b.length;
  let diff = la ^ lb;
  const len = Math.max(la, lb);
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin, LOGIN_METHODS) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';

  if (!env.JWT_SECRET) {
    console.error('[login] JWT_SECRET no configurado');
    return json({ error: 'Error interno del servidor' }, 500, origin, LOGIN_METHODS);
  }

  // Rate limit login attempts
  const clientIP = request.headers.get('CF-Connecting-IP') || '';
  if (checkLoginRateLimit(clientIP)) {
    return json({ error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' }, 429, origin, LOGIN_METHODS);
  }

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return json({ error: 'Credenciales requeridas' }, 400, origin, LOGIN_METHODS);
    }

    const validUser = timingSafeEqual(username, env.ADMIN_USERNAME || '');
    const validPass = timingSafeEqual(password, env.ADMIN_PASSWORD || '');

    if (!validUser || !validPass) {
      await new Promise(r => setTimeout(r, 500));
      return json({ error: 'Usuario o contraseña incorrectos' }, 401, origin, LOGIN_METHODS);
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
        ...corsHeaders(origin, LOGIN_METHODS),
      },
    });
  } catch (e) {
    console.error('[login] Error:', e.message);
    return json({ error: 'Error interno del servidor' }, 500, origin, LOGIN_METHODS);
  }
}
