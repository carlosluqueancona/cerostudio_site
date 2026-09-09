/**
 * POST /api/admin/upload
 * Multipart form-data: campo "file" (imagen)
 * Requiere: Authorization: Bearer <token>
 * Requiere binding R2: IMAGES
 * Requiere env var: R2_PUBLIC_URL (ej: https://pub-xxxx.r2.dev)
 *
 * Retorna: { ok: true, url: "https://..." } | { ok: false, error: "..." }
 */

import { corsHeaders, extractToken, json, purgeUrls, verifyJWT } from './_shared.js';

const MAX_SIZE    = 5 * 1024 * 1024; // 5 MB (imágenes)
const MAX_SIZE_VID = 3 * 1024 * 1024; // 3 MB (loops de hover del portafolio)
const ALLOWED     = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/webm', 'video/mp4'];
const EXT_MAP     = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'video/webm': 'webm', 'video/mp4': 'mp4' };
const isVideo     = (m) => m === 'video/webm' || m === 'video/mp4';

// ── Magic bytes detection ─────────────────────────────────────────────────────
function detectMimeFromBytes(buffer) {
  const b = new Uint8Array(buffer, 0, 12);
  // JPEG: FF D8 FF
  if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'image/jpeg';
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47 &&
      b[4] === 0x0D && b[5] === 0x0A && b[6] === 0x1A && b[7] === 0x0A) return 'image/png';
  // WebP: RIFF????WEBP
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  // GIF87a / GIF89a: GIF8
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'image/gif';
  // WebM (contenedor Matroska): 1A 45 DF A3
  if (b[0] === 0x1A && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3) return 'video/webm';
  // MP4 / QuickTime: 'ftyp' en el offset 4
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) return 'video/mp4';
  return null;
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';

  const token = extractToken(request);
  if (!await verifyJWT(token, env.JWT_SECRET || '')) {
    return json({ ok: false, error: 'No autorizado' }, 401, origin);
  }

  if (!env.IMAGES) {
    return json({ ok: false, error: 'R2 no configurado' }, 500, origin);
  }

  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    if (!url) return json({ ok: false, error: 'URL requerida' }, 400, origin);

    const base = (env.R2_PUBLIC_URL || '').replace(/\/$/, '');
    if (!base || !url.startsWith(base + '/')) {
      return json({ ok: false, error: 'URL no pertenece a este bucket' }, 400, origin);
    }

    const key = url.slice(base.length + 1);
    await env.IMAGES.delete(key);
    // También el thumbnail derivado (no-op si no existe)
    try { await env.IMAGES.delete(`${key}.thumb.jpg`); } catch {}
    return json({ ok: true }, 200, origin);
  } catch (e) {
    console.error('[upload] DELETE error:', e.message);
    return json({ ok: false, error: 'Error al eliminar el archivo' }, 500, origin);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';

  // Auth
  const token = extractToken(request);
  if (!await verifyJWT(token, env.JWT_SECRET || '')) {
    return json({ ok: false, error: 'No autorizado' }, 401, origin);
  }

  // R2 binding check
  if (!env.IMAGES) {
    return json({ ok: false, error: 'R2 no configurado — agrega el binding IMAGES en el dashboard de Cloudflare' }, 500, origin);
  }

  try {
    const formData = await request.formData();
    const file     = formData.get('file');

    if (!file || typeof file === 'string') {
      return json({ ok: false, error: 'No se recibió ningún archivo' }, 400, origin);
    }

    // Validar tamaño
    const buffer = await file.arrayBuffer();

    // Validar tipo MIME por magic bytes (el campo file.type viene del cliente y puede ser falso)
    const detectedMime = detectMimeFromBytes(buffer);
    if (!detectedMime) {
      return json({ ok: false, error: 'Tipo de archivo no permitido. Usa JPG, PNG, WebP, GIF, WebM o MP4.' }, 400, origin);
    }
    const mime = detectedMime;

    // Límite por tipo: los loops del portafolio deben ser ligeros (cargan en hover)
    const limit = isVideo(mime) ? MAX_SIZE_VID : MAX_SIZE;
    if (buffer.byteLength > limit) {
      return json({ ok: false, error: isVideo(mime)
        ? 'El video supera el límite de 3 MB. Recórtalo a 3 s y baja la calidad (ver LEEME de la carpeta de videos).'
        : 'El archivo supera el límite de 5 MB' }, 400, origin);
    }

    // Modo thumbnail derivado: el cliente sube <keyOriginal>.thumb.jpg junto a
    // cada imagen (patrón SergioLuque). Solo se permite ese sufijo — imposible
    // sobreescribir un original — y debe ser JPEG.
    // Modo optimizar-en-sitio: reemplaza los bytes de un objeto EXISTENTE
    // (misma URL, mismo key — las referencias en posts no cambian). El botón
    // "Optimizar" del tab Media re-encodifica en el navegador y sube aquí.
    const replaceKey = formData.get('replace_key');
    if (replaceKey && typeof replaceKey === 'string') {
      if (!/^(blog|portafolio)\/[A-Za-z0-9/_.-]+\.(jpg|jpeg|png|webp|gif)$/i.test(replaceKey)
          || replaceKey.includes('..') || replaceKey.endsWith('.thumb.jpg')) {
        return json({ ok: false, error: 'replace_key inválida' }, 400, origin);
      }
      const existing = await env.IMAGES.head(replaceKey);
      if (!existing) return json({ ok: false, error: 'El objeto a reemplazar no existe' }, 404, origin);
      await env.IMAGES.put(replaceKey, buffer, { httpMetadata: { contentType: mime } });
      const base0 = (env.R2_PUBLIC_URL || '').replace(/\/$/, '');
      // Purge de la URL pública (y su thumb) para que el reemplazo se vea ya
      context.waitUntil?.(purgeUrls(env, [`${base0}/${replaceKey}`, `${base0}/${replaceKey}.thumb.jpg`]));
      return json({ ok: true, url: `${base0}/${replaceKey}`, replaced: true, bytes: buffer.byteLength }, 200, origin);
    }

    const derivedKey = formData.get('key');
    let filename;
    if (derivedKey && typeof derivedKey === 'string') {
      if (!/^(blog|portafolio)\/[A-Za-z0-9/_.-]+\.thumb\.jpg$/.test(derivedKey) || derivedKey.includes('..')) {
        return json({ ok: false, error: 'key derivada inválida' }, 400, origin);
      }
      if (mime !== 'image/jpeg') {
        return json({ ok: false, error: 'El thumbnail debe ser JPEG' }, 400, origin);
      }
      filename = derivedKey;
    } else {
      // Nombre único: blog/2026/04/uuid.ext
      const ext    = EXT_MAP[mime];
      const now    = new Date();
      const folder = isVideo(mime)
        ? 'portafolio/video'
        : `blog/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
      filename = `${folder}/${crypto.randomUUID()}.${ext}`;
    }

    // Subir a R2
    await env.IMAGES.put(filename, buffer, {
      httpMetadata: { contentType: mime },
    });

    // URL pública
    const base = (env.R2_PUBLIC_URL || '').replace(/\/$/, '');
    if (!base) {
      return json({ ok: false, error: 'R2_PUBLIC_URL no configurada. Agrégala como variable de entorno.' }, 500, origin);
    }

    return json({ ok: true, url: `${base}/${filename}` }, 200, origin);

  } catch (e) {
    console.error('[upload] POST error:', e.message);
    return json({ ok: false, error: 'Error al subir el archivo' }, 500, origin);
  }
}
