/**
 * Cloudflare Pages middleware for /api/admin/*
 *
 * Runs before every handler in this directory:
 *   1. Handle OPTIONS (CORS preflight) with the allowed-origin whitelist.
 *   2. Enforce JWT auth on every route EXCEPT those in PUBLIC_PATHS.
 *   3. Inject CORS headers on every response.
 *   4. Expose the verified JWT payload via context.data.user.
 *
 * Token resolution order (supports cookie + Bearer migration):
 *   a. Cookie: cs_admin_jwt   ← preferred (httpOnly, XSS-safe)
 *   b. Authorization: Bearer  ← backward-compat for API clients
 *
 * Required secrets: JWT_SECRET
 */

import { corsHeaders, extractToken, verifyJWT, json } from './_shared.js';

// Routes that skip JWT auth (they issue or clear the token).
const PUBLIC_PATHS = new Set([
  '/api/admin/login',
  '/api/admin/logout',
]);

function applyCors(response, origin) {
  // Preserve multiple Set-Cookie headers (logout clears multiple Path
  // variants). Headers.getSetCookie() returns them as an array; we re-append
  // each one so none are collapsed into a single comma-separated value.
  const h = new Headers(response.headers);
  const setCookies = typeof h.getSetCookie === 'function' ? h.getSetCookie() : [];
  if (setCookies.length > 1) {
    h.delete('Set-Cookie');
    for (const sc of setCookies) h.append('Set-Cookie', sc);
  }
  const c = corsHeaders(origin);
  for (const k in c) h.set(k, c[k]);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: h,
  });
}

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
    return json({ error: 'Error interno del servidor' }, 500, origin);
  }

  const token = extractToken(request);
  const user  = token ? await verifyJWT(token, env.JWT_SECRET) : null;

  if (!user) {
    return json({ error: 'No autorizado' }, 401, origin);
  }

  // 4. Expose the verified payload to handlers.
  context.data      = context.data || {};
  context.data.user = user;

  // 5. Run the handler and merge CORS headers into the response.
  const res = await next();
  return applyCors(res, origin);
}
