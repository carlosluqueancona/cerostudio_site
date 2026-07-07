/**
 * Cloudflare Pages Function: /api/admin/posts
 * All routes require Authorization: Bearer <token>
 *
 * GET    /api/admin/posts        → list all posts (drafts + published)
 * GET    /api/admin/posts?id=N   → single post
 * POST   /api/admin/posts        → create post
 * PUT    /api/admin/posts        → update post (body.id required)
 * DELETE /api/admin/posts?id=N   → delete post
 * POST   /api/admin/posts?action=toggle&id=N → toggle published/draft
 */

import { corsHeaders, json, parseId, purgeBlogCache, requireAuth } from './_shared.js';

function slugify(text) {
  const map = { á:'a', é:'e', í:'i', ó:'o', ú:'u', ñ:'n', ü:'u',
                Á:'a', É:'e', Í:'i', Ó:'o', Ú:'u', Ñ:'n' };
  return text
    .toLowerCase()
    .replace(/[áéíóúñüÁÉÍÓÚÑ]/g, c => map[c] || c)
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Route handlers ────────────────────────────────────────────────────────────

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

/** GET — list all or single post */
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
      const post = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first();
      return post ? json(post, 200, origin) : json({ error: 'No encontrado' }, 404, origin);
    }
    // Pagination: ?limit=200&offset=0 (default 200, max 500)
    const limit  = Math.min(Math.max(parseInt(searchParams.get('limit') || '200', 10) || 200, 1), 500);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);
    const { results } = await env.DB.prepare(
      'SELECT * FROM posts ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(limit, offset).all();
    // Keep array shape for backward compat; paging metadata via headers
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
    console.error('[posts] GET error:', e.message);
    return json({ error: 'Error al obtener los posts' }, 500, origin);
  }
}

/**
 * Programación: status='scheduled' exige published_at futuro (ISO).
 * Devuelve {status, pub} normalizados o {error}.
 */
function resolveSchedule(status, scheduledAt, fallbackPub) {
  if (status === 'scheduled') {
    const d = new Date(scheduledAt || '');
    if (isNaN(d)) return { error: 'Fecha de programación inválida' };
    if (d.getTime() <= Date.now()) return { error: 'La fecha de programación debe ser futura' };
    return { status: 'scheduled', pub: d.toISOString() };
  }
  if (status === 'published') return { status, pub: fallbackPub !== undefined ? fallbackPub : new Date().toISOString() };
  return { status: 'draft', pub: fallbackPub !== undefined ? fallbackPub : null };
}

/** POST — create post OR toggle status */
export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';
  if (!await requireAuth(request, env)) return json({ error: 'No autorizado' }, 401, origin);

  const { searchParams } = new URL(request.url);

  // Toggle action
  if (searchParams.get('action') === 'toggle') {
    const id = parseId(searchParams.get('id'));
    if (!id) return json({ error: 'ID requerido o inválido' }, 400, origin);
    try {
      const post = await env.DB.prepare('SELECT status, slug FROM posts WHERE id = ?').bind(id).first();
      if (!post) return json({ error: 'No encontrado' }, 404, origin);
      // published → draft · draft/scheduled → published (ahora)
      const newStatus = post.status === 'published' ? 'draft' : 'published';
      const pub = newStatus === 'published' ? new Date().toISOString() : null;
      await env.DB.prepare('UPDATE posts SET status = ?, published_at = ? WHERE id = ?')
        .bind(newStatus, pub, id).run();
      context.waitUntil?.(purgeBlogCache(env, [post.slug]));
      return json({ ok: true, status: newStatus }, 200, origin);
    } catch (e) {
      console.error('[posts] toggle error:', e.message);
      return json({ error: 'Error al cambiar el estado' }, 500, origin);
    }
  }

  // Create post
  try {
    const body = await request.json();
    const { title, content, excerpt, category, status,
            featured_image, featured_image_alt, meta_title, meta_description } = body;

    if (!title) return json({ error: 'El título es obligatorio' }, 400, origin);

    const slug = slugify(body.slug || title);
    const sched = resolveSchedule(status, body.scheduled_at);
    if (sched.error) return json({ error: sched.error }, 400, origin);
    const pub = sched.pub;

    const result = await env.DB.prepare(`
      INSERT INTO posts
        (title, slug, category, status, meta_title, meta_description,
         featured_image, featured_image_alt, excerpt, content, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title, slug, category || '', sched.status,
      meta_title || '', meta_description || '',
      featured_image || '', featured_image_alt || '',
      excerpt || '', content || '', pub
    ).run();

    context.waitUntil?.(purgeBlogCache(env, [slug]));
    return json({ ok: true, id: result.meta.last_row_id }, 201, origin);
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return json({ error: 'Ya existe un artículo con ese slug' }, 409, origin);
    console.error('[posts] create error:', e.message);
    return json({ error: 'Error al crear el post' }, 500, origin);
  }
}

/** PUT — update post */
export async function onRequestPut(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';
  if (!await requireAuth(request, env)) return json({ error: 'No autorizado' }, 401, origin);

  try {
    const body = await request.json();
    const { id, title, content, excerpt, category, status,
            featured_image, featured_image_alt, meta_title, meta_description } = body;

    if (!id)    return json({ error: 'ID requerido' }, 400, origin);
    if (!title) return json({ error: 'El título es obligatorio' }, 400, origin);

    const slug     = slugify(body.slug || title);
    const existing = await env.DB.prepare('SELECT status, published_at, slug FROM posts WHERE id = ?').bind(id).first();
    if (!existing) return json({ error: 'No encontrado' }, 404, origin);

    const fallbackPub = (status === 'published' && existing.status !== 'published')
      ? undefined /* resolveSchedule pone now() */
      : existing.published_at;
    const sched = resolveSchedule(status, body.scheduled_at, fallbackPub);
    if (sched.error) return json({ error: sched.error }, 400, origin);
    const pub = sched.pub;

    await env.DB.prepare(`
      UPDATE posts
      SET title = ?, slug = ?, category = ?, status = ?,
          meta_title = ?, meta_description = ?,
          featured_image = ?, featured_image_alt = ?,
          excerpt = ?, content = ?, published_at = ?
      WHERE id = ?
    `).bind(
      title, slug, category || '', sched.status,
      meta_title || '', meta_description || '',
      featured_image || '', featured_image_alt || '',
      excerpt || '', content || '', pub, id
    ).run();

    context.waitUntil?.(purgeBlogCache(env, [slug, existing.slug]));
    return json({ ok: true }, 200, origin);
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return json({ error: 'Ya existe un artículo con ese slug' }, 409, origin);
    console.error('[posts] update error:', e.message);
    return json({ error: 'Error al actualizar el post' }, 500, origin);
  }
}

/** DELETE — remove post */
export async function onRequestDelete(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';
  if (!await requireAuth(request, env)) return json({ error: 'No autorizado' }, 401, origin);

  const { searchParams } = new URL(request.url);
  const id = parseId(searchParams.get('id'));
  if (!id) return json({ error: 'ID requerido o inválido' }, 400, origin);

  try {
    const post = await env.DB.prepare('SELECT slug FROM posts WHERE id = ?').bind(id).first();
    await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
    context.waitUntil?.(purgeBlogCache(env, [post?.slug]));
    return json({ ok: true }, 200, origin);
  } catch (e) {
    console.error('[posts] delete error:', e.message);
    return json({ error: 'Error al eliminar el post' }, 500, origin);
  }
}
