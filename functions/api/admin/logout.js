/**
 * POST /api/admin/logout
 * Clears the cs_admin_jwt httpOnly cookie.
 * No auth required — clearing an already-invalid cookie is harmless.
 */

import { corsHeaders } from './_shared.js';

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin, 'POST, OPTIONS') });
}

export async function onRequestPost(context) {
  const origin = context.request.headers.get('Origin') || '';

  // Expire the cookie immediately by setting Max-Age=0.
  // Emit two Set-Cookie headers to cover Path variants:
  //   - Path=/api/admin (current — matches login.js)
  //   - Path=/          (defensive — covers any legacy cookie)
  const mkExpired = (path) => [
    'cs_admin_jwt=',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    `Path=${path}`,
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ].join('; ');

  const headers = new Headers({
    'Content-Type': 'application/json',
    ...corsHeaders(origin, 'POST, OPTIONS'),
  });
  headers.append('Set-Cookie', mkExpired('/api/admin'));
  headers.append('Set-Cookie', mkExpired('/'));

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
