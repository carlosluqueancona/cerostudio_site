/**
 * Cloudflare Pages Function: /api/admin/messages
 * Requiere Authorization: Bearer <token>
 *
 * GET    /api/admin/messages          → lista todos los mensajes
 * GET    /api/admin/messages?id=N     → un mensaje
 * PATCH  /api/admin/messages?id=N     → marcar como leído/no leído
 * DELETE /api/admin/messages?id=N     → eliminar mensaje
 */

import { corsHeaders, json, parseId, requireAuth } from './_shared.js';

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
  const rawId = searchParams.get('id');

  try {
    if (rawId) {
      const id = parseId(rawId);
      if (!id) return json({ error: 'ID inválido' }, 400, origin);
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

    // Pagination: ?limit=200&offset=0 (default 200, max 500)
    const limit  = Math.min(Math.max(parseInt(searchParams.get('limit') || '200', 10) || 200, 1), 500);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);
    const { results } = await env.DB.prepare(
      'SELECT * FROM contact_submissions ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(limit, offset).all();
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        /* Sin esto, la Cache Rule de la zona (cache everything) congela la
           lista en el edge y el admin muestra estados viejos aunque recargues */
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'X-Pagination-Limit': String(limit),
        'X-Pagination-Offset': String(offset),
        ...corsHeaders(origin),
      },
    });
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
  const id = parseId(searchParams.get('id'));
  if (!id) return json({ error: 'ID requerido o inválido' }, 400, origin);

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
  const id = parseId(searchParams.get('id'));
  if (!id) return json({ error: 'ID requerido o inválido' }, 400, origin);

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
