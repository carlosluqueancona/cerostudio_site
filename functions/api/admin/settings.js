/**
 * Cloudflare Pages Function: /api/admin/settings
 * Requiere sesión admin (cookie/Bearer, igual que el resto de /api/admin/*).
 *
 * Ajustes de sitio editables desde el panel (tabla D1 site_settings).
 * Hoy: contenido base del /llms.txt (header y footer). La tabla se crea
 * lazy en el primer save — no requiere migración manual.
 *
 * GET    /api/admin/settings?key=llms_header → { key, value, default, updated_at }
 *        (value=null si no hay override guardado → se sirve el default)
 * PUT    /api/admin/settings   body {key, value} → upsert override
 * DELETE /api/admin/settings?key=llms_header → borra override (vuelve al default)
 */

import { corsHeaders, json, requireAuth } from './_shared.js';
import { LLMS_DEFAULT_HEADER, LLMS_DEFAULT_FOOTER } from '../../_llms-defaults.js';

const DEFAULTS = {
  llms_header: LLMS_DEFAULT_HEADER,
  llms_footer: LLMS_DEFAULT_FOOTER,
};

const MAX_VALUE_LEN = 50000;

async function ensureTable(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS site_settings (
       key TEXT PRIMARY KEY,
       value TEXT NOT NULL,
       updated_at TEXT NOT NULL
     )`
  ).run();
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';
  if (!await requireAuth(request, env)) return json({ error: 'No autorizado' }, 401, origin);

  const key = new URL(request.url).searchParams.get('key');
  if (!key || !(key in DEFAULTS)) return json({ error: 'key inválida' }, 400, origin);

  try {
    let row = null;
    try {
      row = await env.DB.prepare(
        'SELECT value, updated_at FROM site_settings WHERE key = ?'
      ).bind(key).first();
    } catch {
      row = null; // la tabla aún no existe → no hay override
    }
    return json({
      key,
      value: row?.value ?? null,
      default: DEFAULTS[key],
      updated_at: row?.updated_at ?? null,
    }, 200, origin);
  } catch (e) {
    console.error('[settings] GET error:', e.message);
    return json({ error: 'Error al leer el ajuste' }, 500, origin);
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';
  if (!await requireAuth(request, env)) return json({ error: 'No autorizado' }, 401, origin);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'JSON inválido' }, 400, origin); }

  const { key, value } = body || {};
  if (!key || !(key in DEFAULTS)) return json({ error: 'key inválida' }, 400, origin);
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
    return json({ error: 'Error al guardar el ajuste' }, 500, origin);
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';
  if (!await requireAuth(request, env)) return json({ error: 'No autorizado' }, 401, origin);

  const key = new URL(request.url).searchParams.get('key');
  if (!key || !(key in DEFAULTS)) return json({ error: 'key inválida' }, 400, origin);

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
