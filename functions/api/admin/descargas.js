/**
 * GET /api/admin/descargas
 * Estadísticas del conteo server-side de descargas de recursos (tabla
 * descargas_recursos, poblada por functions/recursos/archivos/[archivo].js).
 * Protegido por el JWT del admin (functions/api/admin/_middleware.js).
 */

export async function onRequestGet({ env }) {
  const empty = { total: 0, por_slug: [], por_dia: [], por_fuente: [], por_dispositivo: [], ultimas: [] };
  try {
    const [total, porSlug, porDia, porFuente, porDispositivo, ultimas] = await Promise.all([
      env.DB.prepare(`SELECT COUNT(*) AS n FROM descargas_recursos`).first(),
      env.DB.prepare(`
        SELECT slug, COUNT(*) AS n FROM descargas_recursos GROUP BY slug ORDER BY n DESC
      `).all(),
      env.DB.prepare(`
        SELECT substr(created_at, 1, 10) AS dia, COUNT(*) AS n
        FROM descargas_recursos GROUP BY dia ORDER BY dia DESC LIMIT 30
      `).all(),
      env.DB.prepare(`
        SELECT COALESCE(NULLIF(utm_source, ''), '(directo)') AS fuente,
               COALESCE(NULLIF(utm_medium, ''), '') AS medio, COUNT(*) AS n
        FROM descargas_recursos GROUP BY fuente, medio ORDER BY n DESC
      `).all(),
      env.DB.prepare(`
        SELECT device, COUNT(*) AS n FROM descargas_recursos GROUP BY device ORDER BY n DESC
      `).all(),
      env.DB.prepare(`
        SELECT slug, created_at, utm_source, utm_medium, country, device, consent
        FROM descargas_recursos ORDER BY id DESC LIMIT 20
      `).all(),
    ]);

    return json({
      total: total?.n ?? 0,
      por_slug: porSlug.results || [],
      por_dia: porDia.results || [],
      por_fuente: porFuente.results || [],
      por_dispositivo: porDispositivo.results || [],
      ultimas: ultimas.results || [],
    });
  } catch (e) {
    // Tabla aún no existe (cero descargas desde el deploy) → stats en cero.
    if (/no such table/i.test(e.message)) return json(empty);
    console.error('[admin/descargas] Error:', e.message);
    return json({ error: 'Error consultando descargas' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
