/**
 * Cloudflare Pages Function: /api/admin/portfolio
 * Requires: Authorization: Bearer <JWT>
 *
 * GET    /api/admin/portfolio               → list all items
 * POST   /api/admin/portfolio               → create item (auto-rebuilds cache)
 * PUT    /api/admin/portfolio?id=N          → update item (auto-rebuilds cache)
 * DELETE /api/admin/portfolio?id=N          → delete item (auto-rebuilds cache)
 * PATCH  /api/admin/portfolio?id=N          → toggle visible (auto-rebuilds cache)
 * POST   /api/admin/portfolio?action=rebuild    → manual rebuild (idempotente)
 *
 * Mutations (POST/PUT/DELETE/PATCH) ejecutan rebuild automáticamente para que
 * el sitio público quede sincronizado sin requerir un click manual de "Publicar
 * cambios". El rebuild se devuelve en `published_count` para feedback en UI.
 * Si el rebuild falla, la mutación ya está aplicada — se devuelve `published_error`
 * para que el cliente pueda alertar y ofrecer reintentarlo manualmente.
 */

import { corsHeaders, json, parseId, requireAuth } from './_shared.js';

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

/**
 * Intenta rebuild y devuelve campos a mezclar en la respuesta de mutación.
 * Nunca lanza — un fallo de rebuild no debe ocultar el éxito del CRUD.
 */
async function tryRebuild(env) {
  try {
    const r = await rebuild(env);
    return { published_count: r.count, published_at: r.updated_at };
  } catch (e) {
    console.error('[portfolio] auto-rebuild failed:', e.message);
    return { published_error: 'Auto-publicación falló — usa "Publicar cambios" manualmente.' };
  }
}

// Validación común de payload de proyecto
function validateProject(body) {
  const { name, url, image, cat_es, cat_en, desc_es, desc_en } = body || {};
  if (!name || !url || !image || !cat_es || !cat_en || !desc_es || !desc_en) {
    return 'Faltan campos requeridos';
  }
  if (!/^(https?:\/\/|\/)/i.test(image)) {
    return 'La imagen debe ser una URL (https://…) o una ruta que empiece con /';
  }
  if (!/^https?:\/\//i.test(url)) {
    return 'La URL del proyecto debe empezar con http:// o https://';
  }
  return null;
}

// Wrapper: log e.message internamente, devuelve mensaje genérico al cliente.
function serverError(e, label) {
  console.error(`[portfolio] ${label} error:`, e?.message || e);
  return { error: 'Error interno del servidor' };
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
    return json(serverError(e, 'GET'), 500, origin);
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
      return json(serverError(e, 'rebuild'), 500, origin);
    }
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'JSON inválido' }, 400, origin); }

  const validationError = validateProject(body);
  if (validationError) return json({ error: validationError }, 400, origin);

  try {
    const { name, url, image, cat_es, cat_en, desc_es, desc_en, sort_order, visible } = body;
    const r = await env.DB.prepare(
      'INSERT INTO portfolio_items (name, url, image, cat_es, cat_en, desc_es, desc_en, sort_order, visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(name, url, image, cat_es, cat_en, desc_es, desc_en, sort_order ?? 0, visible ?? 1).run();
    const rebuildInfo = await tryRebuild(env);
    return json({ success: true, id: r.meta.last_row_id, ...rebuildInfo }, 201, origin);
  } catch (e) {
    return json(serverError(e, 'POST'), 500, origin);
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';
  if (!await requireAuth(request, env)) return json({ error: 'No autorizado' }, 401, origin);

  const { searchParams } = new URL(request.url);
  const id = parseId(searchParams.get('id'));
  if (!id) return json({ error: 'ID requerido o inválido' }, 400, origin);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'JSON inválido' }, 400, origin); }

  const validationError = validateProject(body);
  if (validationError) return json({ error: validationError }, 400, origin);

  try {
    const { name, url, image, cat_es, cat_en, desc_es, desc_en, sort_order, visible } = body;
    const res = await env.DB.prepare(
      'UPDATE portfolio_items SET name=?, url=?, image=?, cat_es=?, cat_en=?, desc_es=?, desc_en=?, sort_order=?, visible=? WHERE id=?'
    ).bind(name, url, image, cat_es, cat_en, desc_es, desc_en, sort_order ?? 0, visible ?? 1, id).run();
    if (!res.meta.changes) return json({ error: 'No encontrado' }, 404, origin);
    const rebuildInfo = await tryRebuild(env);
    return json({ success: true, ...rebuildInfo }, 200, origin);
  } catch (e) {
    return json(serverError(e, 'PUT'), 500, origin);
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
    const res = await env.DB.prepare('DELETE FROM portfolio_items WHERE id = ?').bind(id).run();
    if (!res.meta.changes) return json({ error: 'No encontrado' }, 404, origin);
    const rebuildInfo = await tryRebuild(env);
    return json({ success: true, ...rebuildInfo }, 200, origin);
  } catch (e) {
    return json(serverError(e, 'DELETE'), 500, origin);
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
    const rebuildInfo = await tryRebuild(env);
    return json({ success: true, visible: newVisible, ...rebuildInfo }, 200, origin);
  } catch (e) {
    return json(serverError(e, 'PATCH'), 500, origin);
  }
}
