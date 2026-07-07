/**
 * Cloudflare Pages Function: /api/admin/preview-token
 * GET ?slug=<slug> → { token } — JWT de 1 hora que autoriza previsualizar ese
 * post en /blog/<slug>?preview=<token> aunque sea borrador o programado.
 * Sin dependencia de cookies fuera de /api/admin (la cookie de sesión solo
 * vive ahí; el token viaja en la URL y lo verifica functions/blog/[slug].js).
 */

import { json, requireAuth, signJWT } from './_shared.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';
  if (!await requireAuth(request, env)) return json({ error: 'No autorizado' }, 401, origin);

  const slug = new URL(request.url).searchParams.get('slug');
  if (!slug || !/^[a-z0-9-]{1,200}$/.test(slug)) return json({ error: 'slug inválido' }, 400, origin);

  const token = await signJWT({ prev: slug, exp: Date.now() + 3600e3 }, env.JWT_SECRET);
  return json({ token }, 200, origin);
}
