/**
 * POST /api/admin/upload
 * Multipart form-data: campo "file" (imagen)
 * Requiere: Authorization: Bearer <token>
 * Requiere binding R2: IMAGES
 * Requiere env var: R2_PUBLIC_URL (ej: https://pub-xxxx.r2.dev)
 *
 * Retorna: { ok: true, url: "https://..." } | { ok: false, error: "..." }
 */

const ALLOWED_ORIGINS = ['https://cerostudio.ai', 'https://www.cerostudio.ai'];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

const MAX_SIZE    = 5 * 1024 * 1024; // 5 MB
const ALLOWED     = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const EXT_MAP     = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

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
  return null;
}

// ── JWT verify (igual que en posts.js) ───────────────────────────────────────
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
  } catch { return null; }
}

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';

  const header = request.headers.get('Authorization') || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : '';
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
  const header = request.headers.get('Authorization') || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : '';
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
    if (buffer.byteLength > MAX_SIZE) {
      return json({ ok: false, error: 'El archivo supera el límite de 5 MB' }, 400, origin);
    }

    // Validar tipo MIME por magic bytes (el campo file.type viene del cliente y puede ser falso)
    const detectedMime = detectMimeFromBytes(buffer);
    if (!detectedMime) {
      return json({ ok: false, error: 'Tipo de archivo no permitido. Usa JPG, PNG, WebP o GIF.' }, 400, origin);
    }
    const claimedMime = file.type || '';
    if (claimedMime && claimedMime !== detectedMime) {
      return json({ ok: false, error: 'El tipo de archivo declarado no coincide con su contenido real.' }, 400, origin);
    }
    const mime = detectedMime;

    // Nombre único: blog/2026/04/uuid.ext
    const ext      = EXT_MAP[mime];
    const now      = new Date();
    const folder   = `blog/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    const filename = `${folder}/${crypto.randomUUID()}.${ext}`;

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
