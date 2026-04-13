/**
 * POST /api/contact
 * Recibe el formulario de contacto público.
 * - Guarda en D1 (contact_submissions)
 * - Envía notificación por email via Resend API (env.RESEND_API_KEY)
 *
 * Configuración requerida en Cloudflare Pages → Settings → Environment variables:
 *   RESEND_API_KEY = re_xxxxxxxxxxxx   (obtenido en resend.com)
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const DEST_EMAIL = 'cerostudiomx@gmail.com';
const FROM_EMAIL = 'noreply@cerostudio.ai';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { nombre, email, empresa, servicio, mensaje, _gotcha } = body;

    // Honeypot — bots rellenan este campo
    if (_gotcha) return json({ ok: true });

    // Validación
    if (!nombre?.trim())  return json({ error: 'El nombre es requerido' }, 400);
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return json({ error: 'Email inválido' }, 400);
    if (!mensaje?.trim()) return json({ error: 'El mensaje es requerido' }, 400);

    const now = new Date().toISOString();

    // Guardar en D1
    await env.DB.prepare(`
      INSERT INTO contact_submissions (nombre, email, empresa, servicio, mensaje, leido, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).bind(
      nombre.trim(),
      email.trim().toLowerCase(),
      empresa?.trim()  || '',
      servicio?.trim() || '',
      mensaje.trim(),
      now
    ).run();

    // Enviar email de notificación
    if (env.RESEND_API_KEY) {
      try {
        await sendNotification(env, { nombre, email, empresa, servicio, mensaje, now });
      } catch (err) {
        // El mensaje ya está guardado — no fallar la request si el email falla
        console.error('[contact] Email send error:', err.message);
      }
    }

    return json({ ok: true });
  } catch (e) {
    console.error('[contact] Error:', e.message);
    return json({ error: 'Error interno del servidor' }, 500);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

async function sendNotification(env, { nombre, email, empresa, servicio, mensaje, now }) {
  const fecha = new Date(now).toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const servicioLabels = {
    web:           'Desarrollo Web',
    ecommerce:     'Tienda eCommerce',
    branding:      'Branding Digital',
    seo:           'SEO & Visibilidad',
    mantenimiento: 'Mantenimiento',
    consultoria:   'Consultoría Digital',
    otro:          'Otro',
  };

  const text = [
    `Nuevo mensaje desde el formulario de contacto de cerostudio.ai`,
    ``,
    `Nombre:    ${nombre}`,
    `Email:     ${email}`,
    `Empresa:   ${empresa || '—'}`,
    `Servicio:  ${servicioLabels[servicio] || servicio || '—'}`,
    `Fecha:     ${fecha}`,
    ``,
    `Mensaje:`,
    `----------`,
    mensaje,
    `----------`,
    ``,
    `Responder directamente a: ${email}`,
    `Ver en el admin: https://cerostudio.ai/blog/admin/`,
  ].join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Cero Studio <${FROM_EMAIL}>`,
      to: [DEST_EMAIL],
      reply_to: email,
      subject: `Nuevo mensaje de ${nombre} — Cero Studio`,
      text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error ${res.status}: ${err}`);
  }
}
