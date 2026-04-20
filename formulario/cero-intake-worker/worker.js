/**
 * CERO STUDIO — Intake + Client Portal Worker
 * Cloudflare Worker + D1 Database
 *
 * PUBLIC:  POST /submit, GET /portal/:accessKey
 * ADMIN:   GET  /briefs
 *          GET  /briefs/:id
 *          POST /briefs/manual
 *          PATCH  /briefs/:id/status
 *          PATCH  /briefs/:id/client
 *          POST   /briefs/:id/portal
 *          PATCH  /briefs/:id/phase
 *          POST   /briefs/:id/milestones
 *          PATCH  /milestones/:id
 *          POST   /briefs/:id/files
 *          DELETE /files/:id
 *          POST   /briefs/:id/activity
 *          PATCH  /briefs/:id/payment
 *          PATCH  /briefs/:id/payment/:pid
 *          DELETE /briefs/:id/payment/:pid
 *          DELETE /briefs/:id
 *
 * Architecture:
 *   - A tiny router maps (method, pattern) → handler. Handlers receive
 *     { request, env, params, url, json } and a bag of helpers.
 *   - Admin routes are flagged adminOnly:true; the router rejects without
 *     a valid X-API-Key before invoking the handler.
 *   - CORS, rate limiting, and Turnstile live in the wrapper.
 */

// ─── Config ──────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://cerostudio.ai",
  "https://www.cerostudio.ai",
  "https://intake.cerostudio.ai",
];

const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX    = 10;

const SUBMIT_FIELD_LIMITS = {
  name: 200, email: 254, phone: 50, company: 300, businessName: 300,
  industry: 200, location: 200, targetAudience: 2000, competitors: 2000, usp: 2000,
  currentSite: 500, currentSitePain: 2000, referenceSites: 2000, avoidance: 2000,
  brandColorsDetail: 1000, contentNotes: 2000, goal: 2000, deadlineDetail: 500,
  additionalNotes: 5000, briefText: 10000,
};

const VALID_STATUSES = [
  "new", "reviewed", "proposal_sent", "approved",
  "in_progress", "delivered", "archived",
];

// ─── Input whitelists for dynamic SQL ───────────────────────────────────────
const VALID_MILESTONE_STATUSES = ["pending", "in_progress", "completed"];
const VALID_ENTRY_TYPES        = ["note", "milestone", "payment", "status_change", "file"];
const VALID_FILE_TYPES         = ["contract", "proposal", "design", "asset", "invoice", "other"];

// ─── CORS helpers ────────────────────────────────────────────────────────────
function buildCorsHeaders(reqOrigin) {
  const allowed = ALLOWED_ORIGINS.includes(reqOrigin) ? reqOrigin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, GET, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
  };
}

// ─── Rate limiting (in-memory, per-isolate) ─────────────────────────────────
function checkRateLimit(ip) {
  if (!ip) return false;
  if (!globalThis._rateLimits) globalThis._rateLimits = new Map();
  const now = Date.now();
  const entry = globalThis._rateLimits.get(ip);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    globalThis._rateLimits.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// ─── Turnstile verification ─────────────────────────────────────────────────
/**
 * Returns { ok: true } on success, { ok: false, status, error } on failure.
 * Graceful degradation: if the Turnstile API itself errors, we log and allow
 * (same behavior as the previous implementation).
 */
async function verifyTurnstile(token, env, remoteIp) {
  if (!env.TURNSTILE_SECRET_KEY) return { ok: true };
  if (!token) {
    return { ok: false, status: 403, error: "Verificación de seguridad requerida (Turnstile token faltante)" };
  }
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: remoteIp || undefined,
      }),
    });
    const data = await res.json();
    if (!data.success) {
      console.warn("[intake] Turnstile failed:", data["error-codes"]);
      return { ok: false, status: 403, error: "Verificación de seguridad fallida. Recarga la página e intenta de nuevo." };
    }
    return { ok: true };
  } catch (e) {
    console.error("[intake] Turnstile API error:", e.message);
    return { ok: true }; // graceful degradation
  }
}

// ─── Router ─────────────────────────────────────────────────────────────────
class Router {
  constructor() {
    this.routes = [];
  }
  on(method, pattern, handler, opts = {}) {
    this.routes.push({ method, pattern, handler, adminOnly: !!opts.adminOnly });
    return this;
  }
  match(method, path) {
    for (const r of this.routes) {
      if (r.method !== method) continue;
      const m = path.match(r.pattern);
      if (m) return { route: r, match: m };
    }
    return null;
  }
}

// ─── Handlers (each receives { request, env, url, params, json }) ───────────

// POST /submit
async function handleSubmit({ request, env, json }) {
  const clientIP = request.headers.get("CF-Connecting-IP") || "";
  if (checkRateLimit(clientIP)) {
    return json({ success: false, error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." }, 429);
  }

  const body = await request.json();

  const ts = await verifyTurnstile(body.cf_turnstile_response || "", env, clientIP);
  if (!ts.ok) return json({ success: false, error: ts.error }, ts.status);

  if (!body.name || !body.email || !body.phone) {
    return json({ success: false, error: "Campos requeridos: name, email, phone" }, 400);
  }
  for (const [field, max] of Object.entries(SUBMIT_FIELD_LIMITS)) {
    if (body[field] && String(body[field]).length > max) {
      return json({ success: false, error: `Campo '${field}' excede el límite permitido` }, 400);
    }
  }

  const briefId = `CS-${Date.now().toString(36).toUpperCase()}`;

  await env.DB.prepare(`
    INSERT INTO briefs (
      brief_id, status,
      name, email, phone, company, lang,
      business_name, industry, location, target_audience, competitors, usp,
      project_type, current_site, current_site_pain, pages, features, ecomm_products,
      visual_direction, reference_sites, avoidance, has_logo, has_brand_colors, brand_colors_detail,
      content_status, photo_status, existing_content, content_notes,
      goal, budget, timeline, deadline_detail, maintenance, additional_notes,
      brief_text, submitted_at
    ) VALUES (
      ?1, 'new',
      ?2, ?3, ?4, ?5, ?6,
      ?7, ?8, ?9, ?10, ?11, ?12,
      ?13, ?14, ?15, ?16, ?17, ?18,
      ?19, ?20, ?21, ?22, ?23, ?24,
      ?25, ?26, ?27, ?28,
      ?29, ?30, ?31, ?32, ?33, ?34,
      ?35, datetime('now')
    )
  `).bind(
    briefId,
    body.name || null, body.email || null, body.phone || null, body.company || null, body.lang || null,
    body.businessName || null, body.industry || null, body.location || null, body.targetAudience || null,
    body.competitors || null, body.usp || null,
    JSON.stringify(body.projectType || []), body.currentSite || null, body.currentSitePain || null,
    JSON.stringify(body.pages || []), JSON.stringify(body.features || []), body.ecommProducts || null,
    JSON.stringify(body.visualDirection || []), body.referenceSites || null, body.avoidance || null,
    body.hasLogo || null, body.hasBrandColors || null, body.brandColorsDetail || null,
    body.contentStatus || null, body.photoStatus || null,
    JSON.stringify(body.hasExistingContent || []), body.contentNotes || null,
    body.goal || null, body.budget || null, body.timeline || null,
    body.deadlineDetail || null, body.maintenance || null, body.additionalNotes || null,
    body.briefText || null,
  ).run();

  await sendIntakeEmail(env, briefId, body);

  return json({ success: true, briefId }, 201);
}

async function sendIntakeEmail(env, briefId, body) {
  if (!env.RESEND_API_KEY) return;
  try {
    const emailBody = [
      `NUEVO BRIEF DE PROYECTO: ${briefId}`,
      `═══════════════════════════════════════`,
      ``,
      `Cliente:    ${body.name}`,
      `Email:      ${body.email}`,
      `Teléfono:   ${body.phone}`,
      `Negocio:    ${body.businessName || "—"}`,
      `Industria:  ${body.industry || "—"}`,
      `Ubicación:  ${body.location || "—"}`,
      ``,
      `Tipo de proyecto: ${(body.projectType || []).join(", ")}`,
      `Presupuesto:      ${body.budget || "—"}`,
      `Timeline:         ${body.timeline || "—"}`,
      ``,
      `═══════════════════════════════════════`,
      `Ver brief completo en: https://cerostudio.ai/brief/admin`,
      ``,
      body.briefText || "",
    ].join("\n");

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Cero Studio Intake <intake@cerostudio.ai>",
        to: ["hola@cerostudio.ai"],
        subject: `◉ Nuevo Brief ${briefId} — ${body.businessName || body.name}`,
        text: emailBody,
      }),
    });
    if (!emailRes.ok) console.error("Resend error:", emailRes.status, await emailRes.text());
  } catch (e) {
    console.error("Email notification failed:", e);
  }
}

// GET /portal/:accessKey
async function handlePortalGet({ env, params, json }) {
  const key = params[1];
  const brief = await env.DB.prepare(
    "SELECT brief_id,business_name,name,status,current_phase,total_amount,paid_amount FROM briefs WHERE client_access_key=?1 AND portal_enabled=1"
  ).bind(key).first();
  if (!brief) return json({ error: "Proyecto no encontrado" }, 404);

  const { results: milestones } = await env.DB.prepare(
    "SELECT id,phase,title,description,status,target_date,completed_at FROM milestones WHERE brief_id=?1 ORDER BY phase,id"
  ).bind(brief.brief_id).all();
  const { results: files } = await env.DB.prepare(
    "SELECT id,file_name,file_type,file_url,description,uploaded_at FROM files WHERE brief_id=?1 AND visible=1 ORDER BY uploaded_at DESC"
  ).bind(brief.brief_id).all();
  const { results: activity } = await env.DB.prepare(
    "SELECT id,entry_type,title,description,date FROM activity_log WHERE brief_id=?1 ORDER BY date DESC LIMIT 20"
  ).bind(brief.brief_id).all();

  return json({
    success: true,
    project: {
      id: brief.brief_id, name: brief.business_name || brief.name, clientName: brief.name,
      status: brief.status, currentPhase: brief.current_phase || 0,
      totalAmount: brief.total_amount, paidAmount: brief.paid_amount,
    },
    milestones, files, activity,
  });
}

// GET /briefs
async function handleBriefsList({ env, json }) {
  const { results } = await env.DB.prepare(
    "SELECT brief_id,name,email,business_name,status,current_phase,budget,submitted_at,portal_enabled,client_access_key FROM briefs ORDER BY submitted_at DESC LIMIT 50"
  ).all();
  return json({ success: true, briefs: results });
}

// GET /briefs/:id
async function handleBriefGet({ env, params, json }) {
  const id = params[1];
  const brief = await env.DB.prepare("SELECT * FROM briefs WHERE brief_id=?1").bind(id).first();
  if (!brief) return json({ error: "Brief no encontrado" }, 404);

  const { results: milestones } = await env.DB.prepare(
    "SELECT * FROM milestones WHERE brief_id=?1 ORDER BY phase,id"
  ).bind(id).all();
  const { results: files } = await env.DB.prepare(
    "SELECT * FROM files WHERE brief_id=?1 ORDER BY uploaded_at DESC"
  ).bind(id).all();
  const { results: activity } = await env.DB.prepare(
    "SELECT * FROM activity_log WHERE brief_id=?1 ORDER BY date DESC"
  ).bind(id).all();
  const { results: paymentHistory } = await env.DB.prepare(
    "SELECT id,amount,note,recorded_at FROM payment_history WHERE brief_id=?1 ORDER BY recorded_at DESC"
  ).bind(id).all().catch(() => ({ results: [] }));

  return json({ success: true, brief, milestones, files, activity, paymentHistory });
}

// PATCH /briefs/:id/status
async function handleBriefStatus({ request, env, params, json }) {
  const id = params[1];
  const { status } = await request.json();
  if (!VALID_STATUSES.includes(status)) {
    return json({ success: false, error: `Status inválido. Opciones: ${VALID_STATUSES.join(", ")}` }, 400);
  }
  await env.DB.prepare("UPDATE briefs SET status=?1,updated_at=datetime('now') WHERE brief_id=?2").bind(status, id).run();
  return json({ success: true, briefId: id, status });
}

// POST /briefs/manual
async function handleBriefManualCreate({ request, env, json }) {
  const { name, email, phone, company, current_site, business_name, industry, location, lang } = await request.json();
  if (!name || !email) return json({ error: "Nombre y email son requeridos" }, 400);
  const briefId = `CS-${Date.now().toString(36).toUpperCase()}`;
  await env.DB.prepare(
    `INSERT INTO briefs (brief_id, status, name, email, phone, company, current_site, business_name, industry, location, lang)
     VALUES (?1,'new',?2,?3,?4,?5,?6,?7,?8,?9,?10)`
  ).bind(briefId, name, email, phone || '', company || null, current_site || null, business_name || null, industry || null, location || null, lang || 'Español').run();
  return json({ success: true, briefId }, 201);
}

// PATCH /briefs/:id/client
async function handleBriefClient({ request, env, params, json }) {
  const id = params[1];
  const { name, email, phone, company, current_site, business_name, industry, location, lang } = await request.json();
  await env.DB.prepare(
    `UPDATE briefs SET
      name=?1, email=?2, phone=?3, company=?4, current_site=?5,
      business_name=?6, industry=?7, location=?8, lang=?9,
      updated_at=datetime('now')
    WHERE brief_id=?10`
  ).bind(name || '', email || '', phone || '', company || null, current_site || null, business_name || null, industry || null, location || null, lang || 'Español', id).run();
  return json({ success: true, briefId: id });
}

// POST /briefs/:id/portal
async function handleBriefPortalEnable({ env, params, json }) {
  const id = params[1];
  const accessKey = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(36).padStart(2, "0")).join("").slice(0, 24);
  await env.DB.prepare(
    "UPDATE briefs SET portal_enabled=1,client_access_key=?1,updated_at=datetime('now') WHERE brief_id=?2"
  ).bind(accessKey, id).run();

  const defaults = [
    [0, "Brief recibido",        "Tu informacion ha sido recibida y esta en revision."],
    [0, "Propuesta enviada",     "Revisa tu cotizacion y contrato en la seccion de archivos."],
    [1, "Direccion visual",      "Presentamos opciones de diseno para tu aprobacion."],
    [1, "Diseno aprobado",       "La direccion visual fue aprobada. Iniciamos desarrollo."],
    [3, "Preview del sitio",     "Revisa el avance de tu sitio en el link de staging."],
    [3, "Revisiones completadas","Tus comentarios fueron incorporados al sitio."],
    [4, "QA y optimizacion",     "Pruebas finales de calidad y rendimiento."],
    [4, "Sitio en linea",        "Tu sitio esta publicado y funcionando."],
  ];
  for (const [phase, title, desc] of defaults) {
    await env.DB.prepare(
      "INSERT INTO milestones (brief_id,phase,title,description,status) VALUES (?1,?2,?3,?4,'pending')"
    ).bind(id, phase, title, desc).run();
  }
  return json({ success: true, briefId: id, accessKey, portalUrl: `https://cerostudio.ai/proyecto/?key=${accessKey}` }, 201);
}

// PATCH /briefs/:id/phase
async function handleBriefPhase({ request, env, params, json }) {
  const id = params[1];
  const { phase } = await request.json();
  await env.DB.prepare("UPDATE briefs SET current_phase=?1,updated_at=datetime('now') WHERE brief_id=?2").bind(phase, id).run();
  return json({ success: true, briefId: id, phase });
}

// POST /briefs/:id/milestones
async function handleMilestoneCreate({ request, env, params, json }) {
  const id = params[1];
  const { phase, title, description, target_date } = await request.json();
  if (!title) return json({ success: false, error: "Title requerido" }, 400);
  const r = await env.DB.prepare(
    "INSERT INTO milestones (brief_id,phase,title,description,target_date,status) VALUES (?1,?2,?3,?4,?5,'pending')"
  ).bind(id, phase || 0, title, description || null, target_date || null).run();
  return json({ success: true, milestoneId: r.meta.last_row_id }, 201);
}

// PATCH /milestones/:id
async function handleMilestoneUpdate({ request, env, params, json }) {
  const mid = params[1];
  const body = await request.json();
  const sets = []; const paramsArr = [];
  if (body.status !== undefined) {
    if (!VALID_MILESTONE_STATUSES.includes(body.status)) {
      return json({ success: false, error: `Status inválido. Opciones: ${VALID_MILESTONE_STATUSES.join(", ")}` }, 400);
    }
    sets.push("status=?"); paramsArr.push(body.status);
    if (body.status === "completed") sets.push("completed_at=datetime('now')");
  }
  if (body.title)       { sets.push("title=?");       paramsArr.push(String(body.title).slice(0, 200)); }
  if (body.target_date) { sets.push("target_date=?"); paramsArr.push(body.target_date); }
  if (!sets.length) return json({ success: false, error: "Nada que actualizar" }, 400);
  paramsArr.push(mid);
  await env.DB.prepare(`UPDATE milestones SET ${sets.join(",")} WHERE id=?`).bind(...paramsArr).run();
  return json({ success: true, milestoneId: mid });
}

// POST /briefs/:id/files
async function handleFileCreate({ request, env, params, json }) {
  const id = params[1];
  const { file_name, file_type, file_url, description, visible } = await request.json();
  if (!file_name || !file_url) return json({ success: false, error: "file_name y file_url requeridos" }, 400);
  const safeType = VALID_FILE_TYPES.includes(file_type) ? file_type : "other";
  const r = await env.DB.prepare(
    "INSERT INTO files (brief_id,file_name,file_type,file_url,description,visible) VALUES (?1,?2,?3,?4,?5,?6)"
  ).bind(id, String(file_name).slice(0, 300), safeType, file_url, description || null, visible !== undefined ? visible : 1).run();
  return json({ success: true, fileId: r.meta.last_row_id }, 201);
}

// DELETE /files/:id
async function handleFileDelete({ env, params, json }) {
  await env.DB.prepare("DELETE FROM files WHERE id=?1").bind(params[1]).run();
  return json({ success: true });
}

// POST /briefs/:id/activity
async function handleActivityCreate({ request, env, params, json }) {
  const id = params[1];
  const { entry_type, title, description, date } = await request.json();
  if (!title) return json({ success: false, error: "Title requerido" }, 400);
  const safeType = VALID_ENTRY_TYPES.includes(entry_type) ? entry_type : "note";
  await env.DB.prepare(
    "INSERT INTO activity_log (brief_id,entry_type,title,description,date) VALUES (?1,?2,?3,?4,?5)"
  ).bind(id, safeType, String(title).slice(0, 300), description ? String(description).slice(0, 2000) : null, date || new Date().toISOString()).run();
  return json({ success: true }, 201);
}

// Helper: recalc paid_amount from payment_history sum
async function recalcPaid(env, briefId) {
  const row = await env.DB.prepare(
    "SELECT COALESCE(SUM(amount), 0) as total FROM payment_history WHERE brief_id = ?"
  ).bind(briefId).first();
  const newPaid = row.total;
  await env.DB.prepare(
    "UPDATE briefs SET paid_amount = ?, updated_at = datetime('now') WHERE brief_id = ?"
  ).bind(newPaid, briefId).run();
  return newPaid;
}

// DELETE /briefs/:id/payment/:pid
async function handlePaymentDelete({ env, params, json }) {
  const briefId   = params[1];
  const paymentId = params[2];
  await env.DB.prepare("DELETE FROM payment_history WHERE id = ? AND brief_id = ?").bind(paymentId, briefId).run();
  const newPaid = await recalcPaid(env, briefId);
  const { results: paymentHistory } = await env.DB.prepare(
    "SELECT id,amount,note,recorded_at FROM payment_history WHERE brief_id = ? ORDER BY recorded_at DESC"
  ).bind(briefId).all();
  return json({ success: true, paidAmount: newPaid, paymentHistory });
}

// PATCH /briefs/:id/payment/:pid
async function handlePaymentUpdate({ request, env, params, json }) {
  const briefId   = params[1];
  const paymentId = params[2];
  const { amount, note } = await request.json();
  const sets = []; const paramsArr = [];
  if (amount !== undefined) {
    const parsed = parseFloat(amount);
    if (isNaN(parsed)) return json({ error: "Monto inválido" }, 400);
    sets.push("amount = ?"); paramsArr.push(parsed);
  }
  if (note !== undefined) { sets.push("note = ?"); paramsArr.push(note ? String(note).slice(0, 500) : null); }
  if (!sets.length) return json({ error: "Nada que actualizar" }, 400);
  paramsArr.push(paymentId, briefId);
  await env.DB.prepare(`UPDATE payment_history SET ${sets.join(", ")} WHERE id = ? AND brief_id = ?`).bind(...paramsArr).run();
  const newPaid = await recalcPaid(env, briefId);
  const { results: paymentHistory } = await env.DB.prepare(
    "SELECT id,amount,note,recorded_at FROM payment_history WHERE brief_id = ? ORDER BY recorded_at DESC"
  ).bind(briefId).all();
  return json({ success: true, paidAmount: newPaid, paymentHistory });
}

// PATCH /briefs/:id/payment
async function handlePaymentMain({ request, env, params, json }) {
  const id = params[1];
  const body = await request.json();
  const { total_amount, amount, note } = body;

  if (amount !== undefined) {
    if (isNaN(parseFloat(amount)) || parseFloat(amount) === 0) {
      return json({ error: "Monto inválido" }, 400);
    }
    await env.DB.prepare("INSERT INTO payment_history (brief_id,amount,note) VALUES (?,?,?)").bind(id, parseFloat(amount), note || null).run();
  }

  const sets = ["updated_at = datetime('now')"]; const paramsArr = [];
  if (amount !== undefined) {
    const newPaid = await recalcPaid(env, id);
    sets.push("paid_amount = ?"); paramsArr.push(newPaid);
  }
  if (total_amount !== undefined) { sets.push("total_amount = ?"); paramsArr.push(total_amount); }
  if (paramsArr.length) {
    paramsArr.push(id);
    await env.DB.prepare(`UPDATE briefs SET ${sets.join(", ")} WHERE brief_id = ?`).bind(...paramsArr).run();
  } else if (amount === undefined) {
    return json({ error: "Nada que actualizar" }, 400);
  }

  const { results: paymentHistory } = await env.DB.prepare(
    "SELECT id,amount,note,recorded_at FROM payment_history WHERE brief_id = ? ORDER BY recorded_at DESC"
  ).bind(id).all();
  const paid = await env.DB.prepare("SELECT paid_amount FROM briefs WHERE brief_id = ?").bind(id).first();
  return json({ success: true, briefId: id, paidAmount: paid?.paid_amount, paymentHistory });
}

// DELETE /briefs/:id
async function handleBriefDelete({ env, params, json }) {
  const id = params[1];
  await env.DB.prepare("DELETE FROM payment_history WHERE brief_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM files WHERE brief_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM milestones WHERE brief_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM activity_log WHERE brief_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM briefs WHERE brief_id = ?").bind(id).run();
  return json({ success: true });
}

// ─── Route registration ─────────────────────────────────────────────────────
const router = new Router()
  // Public
  .on("POST", /^\/submit$/,                                   handleSubmit)
  .on("GET",  /^\/portal\/([A-Za-z0-9]+)$/,                   handlePortalGet)

  // Admin — briefs
  .on("GET",    /^\/briefs$/,                                 handleBriefsList,        { adminOnly: true })
  .on("POST",   /^\/briefs\/manual$/,                         handleBriefManualCreate, { adminOnly: true })
  .on("GET",    /^\/briefs\/(CS-[A-Z0-9]+)$/,                 handleBriefGet,          { adminOnly: true })
  .on("PATCH",  /^\/briefs\/(CS-[A-Z0-9]+)\/status$/,         handleBriefStatus,       { adminOnly: true })
  .on("PATCH",  /^\/briefs\/(CS-[A-Z0-9]+)\/client$/,         handleBriefClient,       { adminOnly: true })
  .on("POST",   /^\/briefs\/(CS-[A-Z0-9]+)\/portal$/,         handleBriefPortalEnable, { adminOnly: true })
  .on("PATCH",  /^\/briefs\/(CS-[A-Z0-9]+)\/phase$/,          handleBriefPhase,        { adminOnly: true })
  .on("DELETE", /^\/briefs\/(CS-[A-Z0-9]+)$/,                 handleBriefDelete,       { adminOnly: true })

  // Admin — milestones
  .on("POST",   /^\/briefs\/(CS-[A-Z0-9]+)\/milestones$/,     handleMilestoneCreate,   { adminOnly: true })
  .on("PATCH",  /^\/milestones\/(\d+)$/,                      handleMilestoneUpdate,   { adminOnly: true })

  // Admin — files
  .on("POST",   /^\/briefs\/(CS-[A-Z0-9]+)\/files$/,          handleFileCreate,        { adminOnly: true })
  .on("DELETE", /^\/files\/(\d+)$/,                           handleFileDelete,        { adminOnly: true })

  // Admin — activity
  .on("POST",   /^\/briefs\/(CS-[A-Z0-9]+)\/activity$/,       handleActivityCreate,    { adminOnly: true })

  // Admin — payments (order matters: more-specific :pid routes before general)
  .on("PATCH",  /^\/briefs\/([^/]+)\/payment\/(\d+)$/,        handlePaymentUpdate,     { adminOnly: true })
  .on("DELETE", /^\/briefs\/([^/]+)\/payment\/(\d+)$/,        handlePaymentDelete,     { adminOnly: true })
  .on("PATCH",  /^\/briefs\/([^/]+)\/payment$/,               handlePaymentMain,       { adminOnly: true });

// ─── Entry point ────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const reqOrigin   = request.headers.get("Origin") || "";
    const corsHeaders = buildCorsHeaders(reqOrigin);
    const json        = (data, status = 200) => Response.json(data, { status, headers: corsHeaders });
    const isAdmin     = () => request.headers.get("X-API-Key") === env.ADMIN_API_KEY;

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url  = new URL(request.url);
    const hit  = router.match(request.method, url.pathname);

    if (!hit) return json({ error: "Not found" }, 404);

    if (hit.route.adminOnly && !isAdmin()) {
      return json({ error: "No autorizado" }, 401);
    }

    try {
      return await hit.route.handler({
        request,
        env,
        url,
        params: hit.match,  // [0] = full path, [1..] = captures
        json,
      });
    } catch (err) {
      console.error("Worker error:", err);
      return json({ success: false, error: "Error interno" }, 500);
    }
  },
};
