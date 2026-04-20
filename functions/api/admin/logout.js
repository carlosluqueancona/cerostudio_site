/**
 * POST /api/admin/logout
 * Clears the cs_admin_jwt httpOnly cookie.
 * No auth required — clearing an already-invalid cookie is harmless.
 */

const ALLOWED_ORIGINS = ['https://cerostudio.ai', 'https://www.cerostudio.ai'];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost(context) {
  const origin = context.request.headers.get('Origin') || '';

  // Expire the cookie immediately by setting Max-Age=0
  const expiredCookie = [
    'cs_admin_jwt=',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    'Path=/api/admin',
    'Max-Age=0',
  ].join('; ');

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': expiredCookie,
      ...corsHeaders(origin),
    },
  });
}
