/**
 * POST /api/admin/upload
 * Multipart form-data: campo "file" (imagen)
 * Requiere: Authorization: Bearer <token>
 * Requiere binding R2: IMAGES
 * Requiere env var: R2_PUBLIC_URL (ej: https://pub-xxxx.r2.dev)
 *
 * Retorna: { ok: true, url: "https://..." } | { ok: false, error: "..." }
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const MAX_SIZE    = 5 * 1024 * 1024; // 5 MB
const ALLOWED     = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const EXT_MAP     = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

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

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestDelete(context) {
  const { request, env } = context;

  const header = request.headers.get('Authorization') || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!await verifyJWT(token, env.JWT_SECRET || 'change-this-secret')) {
    return json({ ok: false, error: 'No autorizado' }, 401);
  }

  if (!env.IMAGES) {
    return json({ ok: false, error: 'R2 no configurado' }, 500);
  }

  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    if (!url) return json({ ok: false, error: 'URL requerida' }, 400);

    const base = (env.R2_PUBLIC_URL || '').replace(/\/$/, '');
    if (!base || !url.startsWith(base + '/')) {
      return json({ ok: false, error: 'URL no pertenece a este bucket' }, 400);
    }

    const key = url.slice(base.length + 1);
    await env.IMAGES.delete(key);
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // Auth
  const header = request.headers.get('Authorization') || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!await verifyJWT(token, env.JWT_SECRET || 'change-this-secret')) {
    return json({ ok: false, error: 'No autorizado' }, 401);
  }

  // R2 binding check
  if (!env.IMAGES) {
    return json({ ok: false, error: 'R2 no configurado — agrega el binding IMAGES en el dashboard de Cloudflare' }, 500);
  }

  try {
    const formData = await request.formData();
    const file     = formData.get('file');

    if (!file || typeof file === 'string') {
      return json({ ok: false, error: 'No se recibió ningún archivo' }, 400);
    }

    // Validar tamaño
    const buffer = await file.arrayBuffer();
    if (buffer.byteLength > MAX_SIZE) {
      return json({ ok: false, error: 'El archivo supera el límite de 5 MB' }, 400);
    }

    // Validar tipo MIME
    const mime = file.type || 'application/octet-stream';
    if (!ALLOWED.includes(mime)) {
      return json({ ok: false, error: 'Tipo de archivo no permitido. Usa JPG, PNG, WebP o GIF.' }, 400);
    }

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
      return json({ ok: false, error: 'R2_PUBLIC_URL no configurada. Agrégala como variable de entorno.' }, 500);
    }

    return json({ ok: true, url: `${base}/${filename}` });

  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}
