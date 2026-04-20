/**
 * Cloudflare Pages Function: /api/admin/portfolio
 * Requires: Authorization: Bearer <JWT>
 *
 * GET    /api/admin/portfolio               → list all items
 * POST   /api/admin/portfolio               → create item
 * PUT    /api/admin/portfolio?id=N          → update item
 * DELETE /api/admin/portfolio?id=N          → delete item
 * PATCH  /api/admin/portfolio?id=N&action=toggle → toggle visible
 * POST   /api/admin/portfolio?action=rebuild    → rebuild site_cache HTML
 */

const ALLOWED_ORIGINS = ['https://cerostudio.ai', 'https://www.cerostudio.ai'];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

async function verifyJWT(token, secret) {
  try {
    const [h, b, s] = token.split('.');
    if (!h || !b || !s) return null;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const rawSig = Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, rawSig, enc.encode(`${h}.${b}`));
    if (!valid) return null;
    const payload = JSON.parse(atob(b));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

function extractToken(request) {
  const cookie = request.headers.get('Cookie') || '';
  const match  = cookie.match(/(?:^|;\s*)cs_admin_jwt=([^;]+)/);
  if (match) return match[1];
  const header = request.headers.get('Authorization') || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return '';
}

async function requireAuth(request, env) {
  if (!env.JWT_SECRET) return null;
  const token = extractToken(request);
  return verifyJWT(token, env.JWT_SECRET);
}

/** Parse and validate an integer ID from query params. Returns number or null. */
function parseId(raw) {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPortfolioHTML(items) {
  return items.map((item, i) => {
    const n = i + 1;
    return `<a href="${esc(item.url)}" target="_blank" rel="noopener" class="port-card ht">
  <div class="port-card-img-wrap">
    <img src="${esc(item.image)}" alt="${esc(item.name)}" class="port-card-img" loading="lazy" width="640" height="400">
    <div class="port-card-badge"><span data-i18n="port-badge">Ver Proyecto →</span></div>
  </div>
  <div class="port-card-info">
    <span class="port-card-cat" id="port-c${n}">${esc(item.cat_es)}</span>
    <div class="port-card-name">${esc(item.name)}</div>
    <p class="port-card-desc" id="port-d${n}">${esc(item.desc_es)}</p>
  </div>
</a>`;
  }).join('\n');
}

function buildI18nJSON(items) {
  const es = {}, en = {};
  items.forEach((item, i) => {
    const n = i + 1;
    es[`port-c${n}`] = { t: item.cat_es };
    es[`port-d${n}`] = { t: item.desc_es };
    en[`port-c${n}`] = { t: item.cat_en };
    en[`port-d${n}`] = { t: item.desc_en };
  });
  return JSON.stringify({ es, en });
}

async function rebuild(env) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM portfolio_items WHERE visible = 1 ORDER BY sort_order ASC, id ASC'
  ).all();

  const html  = buildPortfolioHTML(results);
  const i18n  = buildI18nJSON(results);
  const now   = new Date().toISOString();

  await env.DB.prepare(
    "INSERT OR REPLACE INTO site_cache (key, value, updated_at) VALUES ('portfolio_html', ?, ?)"
  ).bind(html, now).run();

  await env.DB.prepare(
    "INSERT OR REPLACE INTO site_cache (key, value, updated_at) VALUES ('portfolio_i18n', ?, ?)"
  ).bind(i18n, now).run();

  return { success: true, count: results.length, updated_at: now };
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';
  if (!await requireAuth(request, env)) return json({ error: 'No autorizado' }, 401, origin);

  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM portfolio_items ORDER BY sort_order ASC, id ASC'
    ).all();
    return json(results, 200, origin);
  } catch (e) {
    return json({ error: e.message }, 500, origin);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';
  if (!await requireAuth(request, env)) return json({ error: 'No autorizado' }, 401, origin);

  const { searchParams } = new URL(request.url);

  if (searchParams.get('action') === 'rebuild') {
    try {
      const result = await rebuild(env);
      return json(result, 200, origin);
    } catch (e) {
      return json({ error: e.message }, 500, origin);
    }
  }

  try {
    const { name, url, image, cat_es, cat_en, desc_es, desc_en, sort_order, visible } = await request.json();
    if (!name || !url || !image || !cat_es || !cat_en || !desc_es || !desc_en) {
      return json({ error: 'Faltan campos requeridos' }, 400, origin);
    }
    const r = await env.DB.prepare(
      'INSERT INTO portfolio_items (name, url, image, cat_es, cat_en, desc_es, desc_en, sort_order, visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(name, url, image, cat_es, cat_en, desc_es, desc_en, sort_order ?? 0, visible ?? 1).run();
    return json({ success: true, id: r.meta.last_row_id }, 201, origin);
  } catch (e) {
    return json({ error: e.message }, 500, origin);
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';
  if (!await requireAuth(request, env)) return json({ error: 'No autorizado' }, 401, origin);

  const { searchParams } = new URL(request.url);
  const id = parseId(searchParams.get('id'));
  if (!id) return json({ error: 'ID requerido o inválido' }, 400, origin);

  try {
    const { name, url, image, cat_es, cat_en, desc_es, desc_en, sort_order, visible } = await request.json();
    await env.DB.prepare(
      'UPDATE portfolio_items SET name=?, url=?, image=?, cat_es=?, cat_en=?, desc_es=?, desc_en=?, sort_order=?, visible=? WHERE id=?'
    ).bind(name, url, image, cat_es, cat_en, desc_es, desc_en, sort_order ?? 0, visible ?? 1, id).run();
    return json({ success: true }, 200, origin);
  } catch (e) {
    return json({ error: e.message }, 500, origin);
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
    await env.DB.prepare('DELETE FROM portfolio_items WHERE id = ?').bind(id).run();
    return json({ success: true }, 200, origin);
  } catch (e) {
    return json({ error: e.message }, 500, origin);
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
    const item = await env.DB.prepare('SELECT visible FROM portfolio_items WHERE id = ?').bind(id).first();
    if (!item) return json({ error: 'No encontrado' }, 404, origin);
    const newVisible = item.visible ? 0 : 1;
    await env.DB.prepare('UPDATE portfolio_items SET visible = ? WHERE id = ?').bind(newVisible, id).run();
    return json({ success: true, visible: newVisible }, 200, origin);
  } catch (e) {
    return json({ error: e.message }, 500, origin);
  }
}
