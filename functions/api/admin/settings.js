/**
 * Cloudflare Pages Function: /api/admin/settings
 * Requiere sesión admin (cookie/Bearer, igual que el resto de /api/admin/*).
 *
 * Overrides POR SECCIÓN del /llms.txt (tabla D1 site_settings; se crea lazy
 * en el primer save — no requiere migración manual). Las secciones y sus
 * defaults viven en functions/_llms-defaults.js.
 *
 * GET    /api/admin/settings?group=llms → [{key, title, default, value, updated_at}]
 *        (value=null si la sección no tiene override → se sirve el default)
 * GET    /api/admin/settings?key=llms_precios → una sola sección
 * PUT    /api/admin/settings   body {key, value} → upsert override de esa sección
 * DELETE /api/admin/settings?key=llms_precios → borra override (vuelve al default)
 */

import { corsHeaders, json, requireAuth } from './_shared.js';
import { LLMS_SECTIONS } from '../../_llms-defaults.js';

const SECTIONS_BY_KEY = Object.fromEntries(LLMS_SECTIONS.map(s => [s.key, s]));

const MAX_VALUE_LEN = 10000;

async function ensureTable(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS site_settings (
       key TEXT PRIMARY KEY,
       value TEXT NOT NULL,
       updated_at TEXT NOT NULL
     )`
  ).run();
}

async function readOverrides(env) {
  try {
    const { results } = await env.DB.prepare(
      "SELECT key, value, updated_at FROM site_settings WHERE key LIKE 'llms_%'"
    ).all();
    return Object.fromEntries((results || []).map(r => [r.key, r]));
  } catch {
    return {}; // la tabla aún no existe → no hay overrides
  }
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';
  if (!await requireAuth(request, env)) return json({ error: 'No autorizado' }, 401, origin);

  const params = new URL(request.url).searchParams;

  try {
    const overrides = await readOverrides(env);

    if (params.get('group') === 'llms') {
      return json(LLMS_SECTIONS.map(s => ({
        key: s.key,
        title: s.title,
        default: s.content,
        value: overrides[s.key]?.value ?? null,
        updated_at: overrides[s.key]?.updated_at ?? null,
      })), 200, origin);
    }

    const key = params.get('key');
    const section = key && SECTIONS_BY_KEY[key];
    if (!section) return json({ error: 'key inválida' }, 400, origin);
    return json({
      key,
      title: section.title,
      default: section.content,
      value: overrides[key]?.value ?? null,
      updated_at: overrides[key]?.updated_at ?? null,
    }, 200, origin);
  } catch (e) {
    console.error('[settings] GET error:', e.message);
    return json({ error: 'Error al leer los ajustes' }, 500, origin);
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';
  if (!await requireAuth(request, env)) return json({ error: 'No autorizado' }, 401, origin);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'JSON inválido' }, 400, origin); }

  const { key, value } = body || {};
  if (!key || !SECTIONS_BY_KEY[key]) return json({ error: 'key inválida' }, 400, origin);
  if (typeof value !== 'string' || !value.trim()) return json({ error: 'value requerido' }, 400, origin);
  if (value.length > MAX_VALUE_LEN) return json({ error: `value excede ${MAX_VALUE_LEN} caracteres` }, 400, origin);

  try {
    await ensureTable(env);
    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    ).bind(key, value, now).run();
    return json({ ok: true, key, updated_at: now }, 200, origin);
  } catch (e) {
    console.error('[settings] PUT error:', e.message);
    return json({ error: 'Error al guardar la sección' }, 500, origin);
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';
  if (!await requireAuth(request, env)) return json({ error: 'No autorizado' }, 401, origin);

  const key = new URL(request.url).searchParams.get('key');
  if (!key || !SECTIONS_BY_KEY[key]) return json({ error: 'key inválida' }, 400, origin);

  try {
    try {
      await env.DB.prepare('DELETE FROM site_settings WHERE key = ?').bind(key).run();
    } catch {
      /* tabla inexistente = ya está en default */
    }
    return json({ ok: true, key, restored: 'default' }, 200, origin);
  } catch (e) {
    console.error('[settings] DELETE error:', e.message);
    return json({ error: 'Error al restaurar el default' }, 500, origin);
  }
}
