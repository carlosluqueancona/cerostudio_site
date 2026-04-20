/**
 * Cloudflare Pages middleware for /api/admin/*
 *
 * Runs before every handler in this directory. Responsibilities:
 *   1. Handle OPTIONS (CORS preflight) with the allowed-origin whitelist.
 *   2. Enforce JWT auth on every route EXCEPT those in PUBLIC_PATHS.
 *   3. Inject CORS headers on every response.
 *   4. Expose the verified JWT payload via context.data.user.
 *
 * Token resolution order (supports gradual migration):
 *   a. Cookie: cs_admin_jwt  ← preferred (httpOnly, XSS-safe)
 *   b. Authorization: Bearer <token>  ← backward-compat for API clients
 *
 * Required secrets: JWT_SECRET
 */

const ALLOWED_ORIGINS = ['https://cerostudio.ai', 'https://www.cerostudio.ai'];

// Routes that skip JWT auth (they issue or clear the token).
const PUBLIC_PATHS = new Set([
  '/api/admin/login',
  '/api/admin/logout',
]);

// ── CORS ────────────────────────────────────────────────────────────────────
function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

function applyCors(response, origin) {
  const h = new Headers(response.headers);
  const c = corsHeaders(origin);
  for (const k in c) h.set(k, c[k]);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: h,
  });
}

function jsonError(message, status, origin) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

// ── Token extraction ────────────────────────────────────────────────────────
/**
 * Extract JWT from:
 *   1. Cookie cs_admin_jwt  (preferred — httpOnly, invisible to JS)
 *   2. Authorization: Bearer <token>  (backward-compatible)
 */
function extractToken(request) {
  // 1. Cookie
  const cookie = request.headers.get('Cookie') || '';
  const match  = cookie.match(/(?:^|;\s*)cs_admin_jwt=([^;]+)/);
  if (match) return match[1];

  // 2. Bearer header
  const auth = request.headers.get('Authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);

  return '';
}

// ── JWT verification ────────────────────────────────────────────────────────
async function verifyJWT(token, secret) {
  try {
    const [h, b, s] = token.split('.');
    if (!h || !b || !s) return null;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const rawSig = Uint8Array.from(
      atob(s.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );
    const valid = await crypto.subtle.verify('HMAC', key, rawSig, enc.encode(`${h}.${b}`));
    if (!valid) return null;
    const payload = JSON.parse(atob(b));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Main middleware ─────────────────────────────────────────────────────────
export async function onRequest(context) {
  const { request, next, env } = context;
  const url    = new URL(request.url);
  const origin = request.headers.get('Origin') || '';

  // 1. CORS preflight — never reaches route handlers.
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  // 2. Public paths skip JWT auth (login issues the token, logout clears it).
  if (PUBLIC_PATHS.has(url.pathname)) {
    const res = await next();
    return applyCors(res, origin);
  }

  // 3. Enforce JWT auth.
  if (!env.JWT_SECRET) {
    console.error('[admin middleware] JWT_SECRET no configurado');
    return jsonError('Error interno del servidor', 500, origin);
  }

  const token = extractToken(request);
  const user  = token ? await verifyJWT(token, env.JWT_SECRET) : null;

  if (!user) {
    return jsonError('No autorizado', 401, origin);
  }

  // 4. Expose the verified payload to handlers.
  context.data       = context.data || {};
  context.data.user  = user;

  // 5. Run the handler and merge CORS headers into the response.
  const res = await next();
  return applyCors(res, origin);
}
