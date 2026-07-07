/**
 * GET /api/admin/media
 * Lista archivos del bucket R2 IMAGES con su URL pública.
 *
 * Query params opcionales:
 *   prefix=blog/2026  → filtrar por prefijo
 *   cursor=...        → paginación
 *
 * Retorna: { ok: true, items: [{key, url, size, uploaded, contentType}], cursor }
 *
 * Subida (POST) y borrado (DELETE) se manejan en /api/admin/upload.
 */

import { corsHeaders, json, requireAuth } from './_shared.js';

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';

  if (!await requireAuth(request, env)) {
    return json({ ok: false, error: 'No autorizado' }, 401, origin);
  }
  if (!env.IMAGES) {
    return json({ ok: false, error: 'R2 no configurado' }, 500, origin);
  }
  const base = (env.R2_PUBLIC_URL || '').replace(/\/$/, '');
  if (!base) {
    return json({ ok: false, error: 'R2_PUBLIC_URL no configurada' }, 500, origin);
  }

  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || '';
    const cursor = searchParams.get('cursor') || undefined;

    // Proxy de lectura: devuelve los bytes de un objeto para que el canvas
    // del admin pueda re-encodificar sin pelear con CORS del dominio de media.
    const getKey = new URL(request.url).searchParams.get('get');
    if (getKey) {
      if (!/^(blog|portafolio)\/[A-Za-z0-9/_.-]+$/.test(getKey) || getKey.includes('..')) {
        return json({ ok: false, error: 'key inválida' }, 400, origin);
      }
      const obj = await env.IMAGES.get(getKey);
      if (!obj) return json({ ok: false, error: 'No encontrado' }, 404, origin);
      return new Response(obj.body, {
        headers: {
          'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
          'Cache-Control': 'no-store',
          ...corsHeaders(origin),
        },
      });
    }

    const listing = await env.IMAGES.list({
      prefix,
      cursor,
      limit: 200,
      include: ['httpMetadata'],
    });

    const items = listing.objects
      // Los thumbnails derivados (<key>.thumb.jpg) no se listan como archivos
      .filter(o => !o.key.endsWith('.thumb.jpg'))
      .map(o => ({
        key:         o.key,
        url:         `${base}/${o.key}`,
        size:        o.size,
        uploaded:    o.uploaded,
        contentType: o.httpMetadata?.contentType || null,
      }))
      .sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded));

    return json({
      ok: true,
      items,
      cursor: listing.truncated ? listing.cursor : null,
    }, 200, origin);

  } catch (e) {
    console.error('[media] GET error:', e.message);
    return json({ ok: false, error: 'Error al listar archivos' }, 500, origin);
  }
}
