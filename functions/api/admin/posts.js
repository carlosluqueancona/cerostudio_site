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

const ALLOWED_ORIGINS = ['https://cerostudio.ai', 'https://www.cerostudio.ai'];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// ── Auth ─────────────────────────────────────────────────────────────────────

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

async function requireAuth(request, env) {
  const header = request.headers.get('Authorization') || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : '';
  return verifyJWT(token, env.JWT_SECRET || 'change-this-secret');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

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
  const id = searchParams.get('id');

  try {
    if (id) {
      const post = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first();
      return post ? json(post, 200, origin) : json({ error: 'No encontrado' }, 404, origin);
    }
    const { results } = await env.DB.prepare(
      'SELECT * FROM posts ORDER BY created_at DESC'
    ).all();
    return json(results, 200, origin);
  } catch (e) {
    console.error('[posts] GET error:', e.message);
    return json({ error: 'Error al obtener los posts' }, 500, origin);
  }
}

/** POST — create post OR toggle status */
export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';
  if (!await requireAuth(request, env)) return json({ error: 'No autorizado' }, 401, origin);

  const { searchParams } = new URL(request.url);

  // Toggle action
  if (searchParams.get('action') === 'toggle') {
    const id = searchParams.get('id');
    if (!id) return json({ error: 'ID requerido' }, 400, origin);
    try {
      const post = await env.DB.prepare('SELECT status FROM posts WHERE id = ?').bind(id).first();
      if (!post) return json({ error: 'No encontrado' }, 404, origin);
      const newStatus = post.status === 'published' ? 'draft' : 'published';
      const pub = newStatus === 'published' ? new Date().toISOString() : null;
      await env.DB.prepare('UPDATE posts SET status = ?, published_at = ? WHERE id = ?')
        .bind(newStatus, pub, id).run();
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
    const pub  = status === 'published' ? new Date().toISOString() : null;

    const result = await env.DB.prepare(`
      INSERT INTO posts
        (title, slug, category, status, meta_title, meta_description,
         featured_image, featured_image_alt, excerpt, content, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title, slug, category || '', status || 'draft',
      meta_title || '', meta_description || '',
      featured_image || '', featured_image_alt || '',
      excerpt || '', content || '', pub
    ).run();

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
    const existing = await env.DB.prepare('SELECT status, published_at FROM posts WHERE id = ?').bind(id).first();
    if (!existing) return json({ error: 'No encontrado' }, 404, origin);

    const pub = (status === 'published' && existing.status !== 'published')
      ? new Date().toISOString()
      : existing.published_at;

    await env.DB.prepare(`
      UPDATE posts
      SET title = ?, slug = ?, category = ?, status = ?,
          meta_title = ?, meta_description = ?,
          featured_image = ?, featured_image_alt = ?,
          excerpt = ?, content = ?, published_at = ?
      WHERE id = ?
    `).bind(
      title, slug, category || '', status || 'draft',
      meta_title || '', meta_description || '',
      featured_image || '', featured_image_alt || '',
      excerpt || '', content || '', pub, id
    ).run();

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
  const id = searchParams.get('id');
  if (!id) return json({ error: 'ID requerido' }, 400, origin);

  try {
    await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
    return json({ ok: true }, 200, origin);
  } catch (e) {
    console.error('[posts] delete error:', e.message);
    return json({ error: 'Error al eliminar el post' }, 500, origin);
  }
}
