/**
 * Cloudflare Pages Function: /api/portfolio-muestras
 * Public endpoint — no auth. Consumido por cero-prospector para armar
 * propuestas con muestras de portafolio agrupadas por giro.
 *
 * GET /api/portfolio-muestras →
 *   {
 *     "muestras": {
 *       "salud":       [{ "nombre": "…", "url": "https://…" }, …],
 *       "restaurante": [ … ],
 *       …
 *     }
 *   }
 *
 * Reglas:
 *   - Solo items con usar_como_muestra=1 y url_sitio no vacío.
 *   - Orden por orden_muestra ASC (menor = primero), máximo 2 por giro.
 *   - Si la migración portfolio_muestras_migration.sql no se ha aplicado
 *     (columnas inexistentes), responde { "muestras": {} } con 200.
 */

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=300',
  'Access-Control-Allow-Origin': '*',
};

const MAX_POR_GIRO = 2;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare(
      `SELECT name, giros, url_sitio
       FROM portfolio_items
       WHERE usar_como_muestra = 1 AND url_sitio IS NOT NULL AND url_sitio != ''
       ORDER BY orden_muestra ASC, id ASC`
    ).all();

    const muestras = {};
    for (const item of results) {
      let giros;
      try { giros = JSON.parse(item.giros || '[]'); } catch { giros = []; }
      if (!Array.isArray(giros)) continue;
      for (const giro of giros) {
        if (typeof giro !== 'string' || !giro) continue;
        if (!muestras[giro]) muestras[giro] = [];
        if (muestras[giro].length >= MAX_POR_GIRO) continue;
        muestras[giro].push({ nombre: item.name, url: item.url_sitio });
      }
    }

    return json({ muestras });
  } catch (e) {
    // Migración aún no aplicada → columnas inexistentes. Responder vacío, no 500.
    if (/no such column/i.test(e?.message || '')) {
      return json({ muestras: {} });
    }
    console.error('[portfolio-muestras] GET error:', e?.message || e);
    return json({ error: 'Error interno del servidor' }, 500);
  }
}
