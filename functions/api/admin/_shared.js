/**
 * Shared utilities for /api/admin/* Pages Functions.
 *
 * Centralizes what used to be duplicated in 6 handlers:
 *   - ALLOWED_ORIGINS / CORS
 *   - JWT sign & verify (HS256) with proper base64url handling
 *   - Token extraction (cookie → Bearer fallback)
 *   - requireAuth wrapper
 *   - parseId, json response helpers
 *
 * NOTE: filenames starting with `_` are NOT routed by Cloudflare Pages.
 * This file is only consumed via `import`.
 */

export const ALLOWED_ORIGINS = [
  'https://cerostudio.ai',
  'https://www.cerostudio.ai',
];

// Permissive default; individual handlers can narrow if they want stricter
// preflight responses, but the middleware already validates methods.
const DEFAULT_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';

// ── CORS ────────────────────────────────────────────────────────────────────
export function corsHeaders(origin, methods = DEFAULT_METHODS) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// ── JSON response helper ────────────────────────────────────────────────────
export function json(data, status = 200, origin = '', methods) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin, methods),
    },
  });
}

// ── Base64url <-> string ────────────────────────────────────────────────────
/** Encode a binary string (bytes as chars) to base64url (no padding). */
export function b64urlEncode(str) {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Decode a base64url string to a binary string.
 * Re-adds missing `=` padding and converts URL-safe chars so `atob` accepts it.
 * Without this, tokens whose payload/signature contains `-` or `_` decode
 * incorrectly or throw.
 */
export function b64urlDecode(str) {
  const pad = str.length % 4;
  const padded = pad ? str + '='.repeat(4 - pad) : str;
  return atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
}

// ── JWT (HS256) ─────────────────────────────────────────────────────────────
export async function signJWT(payload, secret) {
  const enc = new TextEncoder();
  const header = b64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = b64urlEncode(JSON.stringify(payload));
  const data   = `${header}.${body}`;

  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return `${data}.${b64urlEncode(String.fromCharCode(...new Uint8Array(sig)))}`;
}

export async function verifyJWT(token, secret) {
  try {
    const [h, b, s] = token.split('.');
    if (!h || !b || !s) return null;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const rawSig = Uint8Array.from(b64urlDecode(s), c => c.charCodeAt(0));
    const valid  = await crypto.subtle.verify('HMAC', key, rawSig, enc.encode(`${h}.${b}`));
    if (!valid) return null;

    const payload = JSON.parse(b64urlDecode(b));
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Token extraction & auth gate ────────────────────────────────────────────
/**
 * Extract the JWT from:
 *   1. Cookie cs_admin_jwt  (preferred — httpOnly, invisible to JS)
 *   2. Authorization: Bearer <token>  (backward-compatible)
 */
export function extractToken(request) {
  const cookie = request.headers.get('Cookie') || '';
  const match  = cookie.match(/(?:^|;\s*)cs_admin_jwt=([^;]+)/);
  if (match) return match[1];

  const auth = request.headers.get('Authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);

  return '';
}

export async function requireAuth(request, env) {
  if (!env.JWT_SECRET) {
    console.error('[auth] JWT_SECRET no configurado');
    return null;
  }
  const token = extractToken(request);
  return verifyJWT(token, env.JWT_SECRET);
}

// ── Misc ────────────────────────────────────────────────────────────────────
/** Parse and validate a positive integer from query params. */
export function parseId(raw) {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}
