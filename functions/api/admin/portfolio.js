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

// Tags válidos para filtrado por página. Un item puede pertenecer a varios.
// 'home' es especial: controla si aparece en la home (/) además de
// las service pages. Sin el tag 'home', el item solo aparece en las
// service pages donde tenga tag asignado.
// Editar aquí + actualizar admin UI checkboxes + crear/actualizar
// /functions/servicios/{slug}/ correspondiente al añadir tags nuevos.
const VALID_SERVICE_TAGS = [
  'home',
  'desarrollo-web',
  'ecommerce',
  'seo',
  'branding',
  'consultoria',
  'mantenimiento',
  'clinicas',
];

// Giros válidos para muestras de cero-prospector (ver portfolio_muestras_migration.sql).
// Editar aquí + actualizar admin UI checkboxes al añadir giros nuevos.
const VALID_GIROS = [
  'salud',
  'mascotas',
  'estetica',
  'legal_finanzas',
  'restaurante',
  'retail',
  'ecommerce',
  'inmobiliaria',
  'educacion',
  'industrial',
  'generico',
];

function normalizeGiros(raw) {
  // Acepta array de strings o string JSON. Devuelve string JSON canónico
  // ('["salud","retail"]'), filtrado a giros válidos, sin duplicados.
  if (raw == null || raw === '') return '[]';
  let arr = raw;
  if (typeof raw === 'string') {
    try { arr = JSON.parse(raw); } catch { return '[]'; }
  }
  if (!Array.isArray(arr)) return '[]';
  const seen = new Set();
  const unique = [];
  for (const g of arr) {
    const v = String(g).trim().toLowerCase();
    if (VALID_GIROS.includes(v) && !seen.has(v)) { seen.add(v); unique.push(v); }
  }
  return JSON.stringify(unique);
}

function normalizeServiceTags(raw) {
  // Acepta string CSV o array. Devuelve string CSV canónico, filtrado a tags válidos.
  if (raw == null || raw === '') return '';
  const arr = Array.isArray(raw)
    ? raw
    : String(raw).split(',');
  const cleaned = arr
    .map(t => String(t).trim().toLowerCase())
    .filter(t => VALID_SERVICE_TAGS.includes(t));
  // Dedupe preservando orden de aparición.
  const seen = new Set();
  const unique = [];
  for (const t of cleaned) {
    if (!seen.has(t)) { seen.add(t); unique.push(t); }
  }
  return unique.join(',');
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPortfolioHTML(items, lang = 'es') {
  const catKey = lang === 'en' ? 'cat_en' : 'cat_es';
  const descKey = lang === 'en' ? 'desc_en' : 'desc_es';
  const badgeLabel = lang === 'en' ? 'View Project →' : 'Ver Proyecto →';
  return items.map((item, i) => {
    const n = i + 1;
    /* Coerción robusta: show_link puede venir como número (0/1) o string
       ("0"/"1"). Sin Number(), el string "0" sería truthy y renderizaría el
       enlace + badge pese a tener la bandera desactivada en la base de datos. */
    const showLink = item.show_link == null ? 1 : Number(item.show_link);
    /* Loop de hover opcional (se sube desde el admin): js/home.js lo monta
       sobre la imagen solo en escritorio con mouse. Sin video, no cambia nada. */
    const vid = item.video ? ` data-video-src="${esc(item.video)}"` : '';
    const inner = `  <div class="port-card-img-wrap">
    <img src="${esc(item.image)}" alt="${esc(item.name)}" class="port-card-img" loading="lazy" width="640" height="400">${showLink ? `
    <div class="port-card-badge"><span data-i18n="port-badge">${badgeLabel}</span></div>` : ''}
  </div>
  <div class="port-card-info">
    <span class="port-card-cat" id="port-c${n}">${esc(item[catKey])}</span>
    <div class="port-card-name">${esc(item.name)}</div>
    <p class="port-card-desc" id="port-d${n}">${esc(item[descKey])}</p>
  </div>`;
    return showLink
      ? `<a href="${esc(item.url)}" target="_blank" rel="noopener" class="port-card ht"${vid}>\n${inner}\n</a>`
      : `<div class="port-card port-card--no-link"${vid}>\n${inner}\n</div>`;
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

  // 1) Cache global (home page) ────────────────────────────────────────────
  await env.DB.prepare(
    "INSERT OR REPLACE INTO site_cache (key, value, updated_at) VALUES ('portfolio_html', ?, ?)"
  ).bind(html, now).run();

  await env.DB.prepare(
    "INSERT OR REPLACE INTO site_cache (key, value, updated_at) VALUES ('portfolio_i18n', ?, ?)"
  ).bind(i18n, now).run();

  // 2) Cache per-service-tag (cada página de servicio) ─────────────────────
  // Para cada tag, filtra items que lo contienen en service_tags (CSV).
  // Match por includes() después de split — más seguro que LIKE con %.
  // Generamos cache ES (key sin sufijo) y EN (key con _en) para que el
  // middleware pueda servir SSR HTML en el idioma de la página.
  const perTagCounts = {};
  for (const tag of VALID_SERVICE_TAGS) {
    const tagItems = results.filter(item => {
      const tags = (item.service_tags || '').split(',').map(t => t.trim()).filter(Boolean);
      return tags.includes(tag);
    });
    const tagHtmlEs = buildPortfolioHTML(tagItems, 'es');
    const tagHtmlEn = buildPortfolioHTML(tagItems, 'en');
    const tagI18n   = buildI18nJSON(tagItems);

    await env.DB.prepare(
      "INSERT OR REPLACE INTO site_cache (key, value, updated_at) VALUES (?, ?, ?)"
    ).bind(`portfolio_html_tag_${tag}`, tagHtmlEs, now).run();

    await env.DB.prepare(
      "INSERT OR REPLACE INTO site_cache (key, value, updated_at) VALUES (?, ?, ?)"
    ).bind(`portfolio_html_tag_${tag}_en`, tagHtmlEn, now).run();

    await env.DB.prepare(
      "INSERT OR REPLACE INTO site_cache (key, value, updated_at) VALUES (?, ?, ?)"
    ).bind(`portfolio_i18n_tag_${tag}`, tagI18n, now).run();

    perTagCounts[tag] = tagItems.length;
  }

  return { success: true, count: results.length, per_tag: perTagCounts, updated_at: now };
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
  const { name, url, image, cat_es, cat_en, desc_es, desc_en, show_link } = body || {};
  // URL es opcional cuando show_link=0 (la card no se renderiza como enlace).
  const linkOn = show_link == null ? 1 : Number(show_link);
  const requireUrl = linkOn === 1;
  if (!name || !image || !cat_es || !cat_en || !desc_es || !desc_en || (requireUrl && !url)) {
    return 'Faltan campos requeridos';
  }
  if (!/^(https?:\/\/|\/)/i.test(image)) {
    return 'La imagen debe ser una URL (https://…) o una ruta que empiece con /';
  }
  if (url && !/^https?:\/\//i.test(url)) {
    return 'La URL del proyecto debe empezar con http:// o https://';
  }
  // video (loop de hover) es opcional; si viene debe ser URL o ruta y terminar en webm/mp4.
  if (body?.video) {
    if (!/^(https?:\/\/|\/)/i.test(body.video)) {
      return 'El video debe ser una URL (https://…) o una ruta que empiece con /';
    }
    if (!/\.(webm|mp4)(\?.*)?$/i.test(body.video)) {
      return 'El video debe ser un archivo .webm o .mp4';
    }
  }
  // service_tags es opcional; normalize ya filtra inválidos silenciosamente.
  // url_sitio (muestra para cero-prospector) es opcional pero si viene debe ser http(s).
  if (body?.url_sitio && !/^https?:\/\//i.test(body.url_sitio)) {
    return 'La URL del sitio (muestra) debe empezar con http:// o https://';
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

  // Reordenar: sube/baja un item intercambiándolo con su vecino en el orden
  // actual (sort_order ASC, id ASC). Reasigna sort_order secuencial a TODAS
  // las filas → robusto ante empates o sort_order=0 duplicados (si solo
  // intercambiáramos valores, dos ceros no moverían nada).
  if (searchParams.get('action') === 'reorder') {
    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'JSON inválido' }, 400, origin); }
    const id = parseId(body?.id);
    const dir = body?.dir;
    if (!id || (dir !== 'up' && dir !== 'down')) {
      return json({ error: 'Parámetros inválidos' }, 400, origin);
    }
    try {
      const { results } = await env.DB.prepare(
        'SELECT id FROM portfolio_items ORDER BY sort_order ASC, id ASC'
      ).all();
      const idx = results.findIndex(r => r.id === id);
      if (idx === -1) return json({ error: 'No encontrado' }, 404, origin);
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= results.length) {
        return json({ success: true, noop: true }, 200, origin); // ya está en el borde
      }
      [results[idx], results[swap]] = [results[swap], results[idx]];
      const stmt = env.DB.prepare('UPDATE portfolio_items SET sort_order = ? WHERE id = ?');
      await env.DB.batch(results.map((r, i) => stmt.bind(i, r.id)));
      const rebuildInfo = await tryRebuild(env);
      return json({ success: true, ...rebuildInfo }, 200, origin);
    } catch (e) {
      return json(serverError(e, 'reorder'), 500, origin);
    }
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'JSON inválido' }, 400, origin); }

  const validationError = validateProject(body);
  if (validationError) return json({ error: validationError }, 400, origin);

  try {
    const { name, url, image, video, cat_es, cat_en, desc_es, desc_en, sort_order, visible, show_link, service_tags, giros, usar_como_muestra, url_sitio, orden_muestra } = body;
    const tagsCSV = normalizeServiceTags(service_tags);
    const girosJSON = normalizeGiros(giros);
    const r = await env.DB.prepare(
      'INSERT INTO portfolio_items (name, url, image, video, cat_es, cat_en, desc_es, desc_en, sort_order, visible, show_link, service_tags, giros, usar_como_muestra, url_sitio, orden_muestra) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(name, url || '', image, video || '', cat_es, cat_en, desc_es, desc_en, sort_order ?? 0, visible ?? 1, show_link ?? 1, tagsCSV, girosJSON, Number(usar_como_muestra) ? 1 : 0, url_sitio || '', parseInt(orden_muestra, 10) || 0).run();
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
    const { name, url, image, video, cat_es, cat_en, desc_es, desc_en, sort_order, visible, show_link, service_tags, giros, usar_como_muestra, url_sitio, orden_muestra } = body;
    const tagsCSV = normalizeServiceTags(service_tags);
    const girosJSON = normalizeGiros(giros);
    const res = await env.DB.prepare(
      'UPDATE portfolio_items SET name=?, url=?, image=?, video=?, cat_es=?, cat_en=?, desc_es=?, desc_en=?, sort_order=?, visible=?, show_link=?, service_tags=?, giros=?, usar_como_muestra=?, url_sitio=?, orden_muestra=? WHERE id=?'
    ).bind(name, url || '', image, video || '', cat_es, cat_en, desc_es, desc_en, sort_order ?? 0, visible ?? 1, show_link ?? 1, tagsCSV, girosJSON, Number(usar_como_muestra) ? 1 : 0, url_sitio || '', parseInt(orden_muestra, 10) || 0, id).run();
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
