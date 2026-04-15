/**
 * Cloudflare Pages Function: /api/admin/messages
 * Requiere Authorization: Bearer <token>
 *
 * GET    /api/admin/messages          → lista todos los mensajes
 * GET    /api/admin/messages?id=N     → un mensaje
 * PATCH  /api/admin/messages?id=N     → marcar como leído/no leído
 * DELETE /api/admin/messages?id=N     → eliminar mensaje
 */

const ALLOWED_ORIGINS = ['https://cerostudio.ai', 'https://www.cerostudio.ai'];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// ── Auth (mismo patrón que posts.js) ─────────────────────────────────────────

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
  } catch { return null; }
}

async function requireAuth(request, env) {
  const header = request.headers.get('Authorization') || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : '';
  return verifyJWT(token, env.JWT_SECRET || 'change-this-secret');
}

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';
  if (!await requireAuth(request, env)) return json({ error: 'No autorizado' }, 401, origin);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      const msg = await env.DB.prepare(
        'SELECT * FROM contact_submissions WHERE id = ?'
      ).bind(id).first();

      if (!msg) return json({ error: 'No encontrado' }, 404, origin);

      // Marcar como leído automáticamente al abrir
      if (!msg.leido) {
        await env.DB.prepare(
          'UPDATE contact_submissions SET leido = 1 WHERE id = ?'
        ).bind(id).run();
        msg.leido = 1;
      }

      return json(msg, 200, origin);
    }

    const { results } = await env.DB.prepare(
      'SELECT * FROM contact_submissions ORDER BY created_at DESC'
    ).all();
    return json(results, 200, origin);
  } catch (e) {
    console.error('[messages] GET error:', e.message);
    return json({ error: 'Error al obtener los mensajes' }, 500, origin);
  }
}

export async function onRequestPatch(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';
  if (!await requireAuth(request, env)) return json({ error: 'No autorizado' }, 401, origin);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return json({ error: 'ID requerido' }, 400, origin);

  try {
    const body = await request.json();
    const leido = body.leido ? 1 : 0;
    await env.DB.prepare(
      'UPDATE contact_submissions SET leido = ? WHERE id = ?'
    ).bind(leido, id).run();
    return json({ ok: true }, 200, origin);
  } catch (e) {
    console.error('[messages] PATCH error:', e.message);
    return json({ error: 'Error al actualizar el mensaje' }, 500, origin);
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';
  if (!await requireAuth(request, env)) return json({ error: 'No autorizado' }, 401, origin);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return json({ error: 'ID requerido' }, 400, origin);

  try {
    await env.DB.prepare(
      'DELETE FROM contact_submissions WHERE id = ?'
    ).bind(id).run();
    return json({ ok: true }, 200, origin);
  } catch (e) {
    console.error('[messages] DELETE error:', e.message);
    return json({ error: 'Error al eliminar el mensaje' }, 500, origin);
  }
}
