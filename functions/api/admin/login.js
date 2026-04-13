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

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return json({ error: 'Credenciales requeridas' }, 400);
    }

    const validUser = timingSafeEqual(username, env.ADMIN_USERNAME || '');
    const validPass = timingSafeEqual(password, env.ADMIN_PASSWORD || '');

    if (!validUser || !validPass) {
      // Artificial delay to slow brute force
      await new Promise(r => setTimeout(r, 500));
      return json({ error: 'Usuario o contraseña incorrectos' }, 401);
    }

    const token = await signJWT(
      { sub: username, iat: Date.now(), exp: Date.now() + 86_400_000 }, // 24 h
      env.JWT_SECRET || 'change-this-secret'
    );

    return json({ token });
  } catch (e) {
    return json({ error: 'Error interno del servidor' }, 500);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
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
