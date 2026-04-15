/**
 * CERO STUDIO — Intake + Client Portal Worker
 * Cloudflare Worker + D1 Database
 *
 * PUBLIC:  POST /submit, GET /portal/:accessKey
 * ADMIN:   GET /briefs, GET /briefs/:id, PATCH /briefs/:id/status,
 *          POST /briefs/:id/portal, PATCH /briefs/:id/phase,
 *          POST /briefs/:id/milestones, PATCH /milestones/:id,
 *          POST /briefs/:id/files, DELETE /files/:id,
 *          POST /briefs/:id/activity,
 *          PATCH /briefs/:id/payment, PATCH /briefs/:id/payment/:pid,
 *          DELETE /briefs/:id/payment/:pid
 */

export default {
  async fetch(request, env) {
    // ─── CORS headers ───
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url  = new URL(request.url);
    const path = url.pathname;
    const json = (data, status = 200) => Response.json(data, { status, headers: corsHeaders });
    const isAdmin = () => request.headers.get("X-API-Key") === env.ADMIN_API_KEY;

    try {

      // ══════════════════════════════════════════
      //  PUBLIC ENDPOINTS
      // ══════════════════════════════════════════

      // ── POST /submit ──
      if (request.method === "POST" && path === "/submit") {
        const body = await request.json();

        // Verificar Turnstile (obligatorio)
        if (!env.TURNSTILE_SECRET_KEY) {
          console.error("[intake] TURNSTILE_SECRET_KEY no configurado");
          return json({ success: false, error: "Configuración del servidor incorrecta" }, 500);
        }
        const tsToken = body.cf_turnstile_response || "";
        if (!tsToken) return json({ success: false, error: "Verificación de seguridad requerida" }, 400);

        const tsRes  = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secret:   env.TURNSTILE_SECRET_KEY,
            response: tsToken,
            remoteip: request.headers.get("CF-Connecting-IP") || undefined,
          }),
        });
        const tsData = await tsRes.json();
        if (!tsData.success) return json({ success: false, error: "Verificación de seguridad fallida" }, 403);

        // Validate required fields
        if (!body.name || !body.email || !body.phone) {
          return json({ success: false, error: "Campos requeridos: name, email, phone" }, 400);
        }

        // Validate input size limits
        const LIMITS = {
          name: 200, email: 254, phone: 50, company: 300, businessName: 300,
          industry: 200, location: 200, targetAudience: 2000, competitors: 2000, usp: 2000,
          currentSite: 500, currentSitePain: 2000, referenceSites: 2000, avoidance: 2000,
          brandColorsDetail: 1000, contentNotes: 2000, goal: 2000, deadlineDetail: 500,
          additionalNotes: 5000, briefText: 10000,
        };
        for (const [field, max] of Object.entries(LIMITS)) {
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

        // Email notification via Resend
        if (env.RESEND_API_KEY) {
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
          } catch (emailErr) {
            console.error("Email notification failed:", emailErr);
          }
        }

        return json({ success: true, briefId }, 201);
      }

      // ── GET /portal/:accessKey ──
      if (request.method === "GET" && /^\/portal\/[A-Za-z0-9]+$/.test(path)) {
        const key = path.split("/portal/")[1];
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

      // ══════════════════════════════════════════
      //  ADMIN ENDPOINTS
      // ══════════════════════════════════════════

      // ── GET /briefs ──
      if (request.method === "GET" && path === "/briefs") {
        if (!isAdmin()) return json({ error: "No autorizado" }, 401);
        const { results } = await env.DB.prepare(
          "SELECT brief_id,name,email,business_name,status,current_phase,budget,submitted_at,portal_enabled,client_access_key FROM briefs ORDER BY submitted_at DESC LIMIT 50"
        ).all();
        return json({ success: true, briefs: results });
      }

      // ── GET /briefs/:id ──
      if (request.method === "GET" && /^\/briefs\/CS-[A-Z0-9]+$/.test(path)) {
        if (!isAdmin()) return json({ error: "No autorizado" }, 401);
        const id = path.split("/briefs/")[1];
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

      // ── PATCH /briefs/:id/status ──
      if (request.method === "PATCH" && /^\/briefs\/CS-[A-Z0-9]+\/status$/.test(path)) {
        if (!isAdmin()) return json({ error: "No autorizado" }, 401);
        const id = path.split("/briefs/")[1].split("/")[0];
        const { status } = await request.json();
        const valid = ["new","reviewed","proposal_sent","approved","in_progress","delivered","archived"];
        if (!valid.includes(status)) return json({ success: false, error: `Status inválido. Opciones: ${valid.join(", ")}` }, 400);
        await env.DB.prepare("UPDATE briefs SET status=?1,updated_at=datetime('now') WHERE brief_id=?2").bind(status, id).run();
        return json({ success: true, briefId: id, status });
      }

      // ── POST /briefs/:id/portal — Enable portal ──
      if (request.method === "POST" && /^\/briefs\/CS-[A-Z0-9]+\/portal$/.test(path)) {
        if (!isAdmin()) return json({ error: "No autorizado" }, 401);
        const id = path.split("/briefs/")[1].split("/")[0];
        const accessKey = Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map(b => b.toString(36).padStart(2, "0")).join("").slice(0, 24);
        await env.DB.prepare(
          "UPDATE briefs SET portal_enabled=1,client_access_key=?1,updated_at=datetime('now') WHERE brief_id=?2"
        ).bind(accessKey, id).run();
        const defaults = [
          [0, "Brief recibido",       "Tu informacion ha sido recibida y esta en revision."],
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

      // ── PATCH /briefs/:id/phase ──
      if (request.method === "PATCH" && /^\/briefs\/CS-[A-Z0-9]+\/phase$/.test(path)) {
        if (!isAdmin()) return json({ error: "No autorizado" }, 401);
        const id = path.split("/briefs/")[1].split("/")[0];
        const { phase } = await request.json();
        await env.DB.prepare("UPDATE briefs SET current_phase=?1,updated_at=datetime('now') WHERE brief_id=?2").bind(phase, id).run();
        return json({ success: true, briefId: id, phase });
      }

      // ── POST /briefs/:id/milestones ──
      if (request.method === "POST" && /^\/briefs\/CS-[A-Z0-9]+\/milestones$/.test(path)) {
        if (!isAdmin()) return json({ error: "No autorizado" }, 401);
        const id = path.split("/briefs/")[1].split("/")[0];
        const { phase, title, description, target_date } = await request.json();
        if (!title) return json({ success: false, error: "Title requerido" }, 400);
        const r = await env.DB.prepare(
          "INSERT INTO milestones (brief_id,phase,title,description,target_date,status) VALUES (?1,?2,?3,?4,?5,'pending')"
        ).bind(id, phase || 0, title, description || null, target_date || null).run();
        return json({ success: true, milestoneId: r.meta.last_row_id }, 201);
      }

      // ── PATCH /milestones/:id ──
      if (request.method === "PATCH" && /^\/milestones\/\d+$/.test(path)) {
        if (!isAdmin()) return json({ error: "No autorizado" }, 401);
        const mid = path.split("/milestones/")[1];
        const body = await request.json();
        const sets = []; const params = [];
        if (body.status !== undefined) {
          sets.push("status=?"); params.push(body.status);
          if (body.status === "completed") sets.push("completed_at=datetime('now')");
        }
        if (body.title)       { sets.push("title=?");       params.push(body.title); }
        if (body.target_date) { sets.push("target_date=?"); params.push(body.target_date); }
        if (!sets.length) return json({ success: false, error: "Nada que actualizar" }, 400);
        params.push(mid);
        await env.DB.prepare(`UPDATE milestones SET ${sets.join(",")} WHERE id=?`).bind(...params).run();
        return json({ success: true, milestoneId: mid });
      }

      // ── POST /briefs/:id/files ──
      if (request.method === "POST" && /^\/briefs\/CS-[A-Z0-9]+\/files$/.test(path)) {
        if (!isAdmin()) return json({ error: "No autorizado" }, 401);
        const id = path.split("/briefs/")[1].split("/")[0];
        const { file_name, file_type, file_url, description, visible } = await request.json();
        if (!file_name || !file_url) return json({ success: false, error: "file_name y file_url requeridos" }, 400);
        const r = await env.DB.prepare(
          "INSERT INTO files (brief_id,file_name,file_type,file_url,description,visible) VALUES (?1,?2,?3,?4,?5,?6)"
        ).bind(id, file_name, file_type || "other", file_url, description || null, visible !== undefined ? visible : 1).run();
        return json({ success: true, fileId: r.meta.last_row_id }, 201);
      }

      // ── DELETE /files/:id ──
      if (request.method === "DELETE" && /^\/files\/\d+$/.test(path)) {
        if (!isAdmin()) return json({ error: "No autorizado" }, 401);
        await env.DB.prepare("DELETE FROM files WHERE id=?1").bind(path.split("/files/")[1]).run();
        return json({ success: true });
      }

      // ── POST /briefs/:id/activity ──
      if (request.method === "POST" && /^\/briefs\/CS-[A-Z0-9]+\/activity$/.test(path)) {
        if (!isAdmin()) return json({ error: "No autorizado" }, 401);
        const id = path.split("/briefs/")[1].split("/")[0];
        const { entry_type, title, description, date } = await request.json();
        if (!title) return json({ success: false, error: "Title requerido" }, 400);
        await env.DB.prepare(
          "INSERT INTO activity_log (brief_id,entry_type,title,description,date) VALUES (?1,?2,?3,?4,?5)"
        ).bind(id, entry_type || "note", title, description || null, date || new Date().toISOString()).run();
        return json({ success: true }, 201);
      }

      // ── Helper: recalc paid_amount from payment_history sum ──
      async function recalcPaid(briefId) {
        const row = await env.DB.prepare(
          "SELECT COALESCE(SUM(amount), 0) as total FROM payment_history WHERE brief_id = ?"
        ).bind(briefId).first();
        const newPaid = row.total;
        await env.DB.prepare(
          "UPDATE briefs SET paid_amount = ?, updated_at = datetime('now') WHERE brief_id = ?"
        ).bind(newPaid, briefId).run();
        return newPaid;
      }

      // ── DELETE /briefs/:id/payment/:pid ──
      if (request.method === "DELETE" && /^\/briefs\/[^/]+\/payment\/\d+$/.test(path)) {
        if (!isAdmin()) return json({ error: "No autorizado" }, 401);
        const parts    = path.split("/");
        const briefId  = parts[2];
        const paymentId = parts[4];
        await env.DB.prepare("DELETE FROM payment_history WHERE id = ? AND brief_id = ?").bind(paymentId, briefId).run();
        const newPaid = await recalcPaid(briefId);
        const { results: paymentHistory } = await env.DB.prepare(
          "SELECT id,amount,note,recorded_at FROM payment_history WHERE brief_id = ? ORDER BY recorded_at DESC"
        ).bind(briefId).all();
        return json({ success: true, paidAmount: newPaid, paymentHistory });
      }

      // ── PATCH /briefs/:id/payment/:pid ──
      if (request.method === "PATCH" && /^\/briefs\/[^/]+\/payment\/\d+$/.test(path)) {
        if (!isAdmin()) return json({ error: "No autorizado" }, 401);
        const parts    = path.split("/");
        const briefId  = parts[2];
        const paymentId = parts[4];
        const { amount, note } = await request.json();
        const sets = []; const params = [];
        if (amount !== undefined) { sets.push("amount = ?"); params.push(parseFloat(amount)); }
        if (note   !== undefined) { sets.push("note = ?");   params.push(note); }
        if (!sets.length) return json({ error: "Nada que actualizar" }, 400);
        params.push(paymentId, briefId);
        await env.DB.prepare(`UPDATE payment_history SET ${sets.join(", ")} WHERE id = ? AND brief_id = ?`).bind(...params).run();
        const newPaid = await recalcPaid(briefId);
        const { results: paymentHistory } = await env.DB.prepare(
          "SELECT id,amount,note,recorded_at FROM payment_history WHERE brief_id = ? ORDER BY recorded_at DESC"
        ).bind(briefId).all();
        return json({ success: true, paidAmount: newPaid, paymentHistory });
      }

      // ── PATCH /briefs/:id/payment ──
      if (request.method === "PATCH" && /^\/briefs\/[^/]+\/payment$/.test(path)) {
        if (!isAdmin()) return json({ error: "No autorizado" }, 401);
        const id   = path.split("/briefs/")[1].split("/payment")[0];
        const body = await request.json();
        const { total_amount, amount, note } = body;

        if (amount !== undefined) {
          if (isNaN(parseFloat(amount)) || parseFloat(amount) === 0) {
            return json({ error: "Monto inválido" }, 400);
          }
          await env.DB.prepare("INSERT INTO payment_history (brief_id,amount,note) VALUES (?,?,?)").bind(id, parseFloat(amount), note || null).run();
        }

        const sets = ["updated_at = datetime('now')"]; const params = [];
        if (amount !== undefined) {
          const newPaid = await recalcPaid(id);
          sets.push("paid_amount = ?"); params.push(newPaid);
        }
        if (total_amount !== undefined) { sets.push("total_amount = ?"); params.push(total_amount); }
        if (params.length) {
          params.push(id);
          await env.DB.prepare(`UPDATE briefs SET ${sets.join(", ")} WHERE brief_id = ?`).bind(...params).run();
        } else if (amount === undefined) {
          return json({ error: "Nada que actualizar" }, 400);
        }

        const { results: paymentHistory } = await env.DB.prepare(
          "SELECT id,amount,note,recorded_at FROM payment_history WHERE brief_id = ? ORDER BY recorded_at DESC"
        ).bind(id).all();
        const paid = await env.DB.prepare("SELECT paid_amount FROM briefs WHERE brief_id = ?").bind(id).first();
        return json({ success: true, briefId: id, paidAmount: paid?.paid_amount, paymentHistory });
      }

      return json({ error: "Not found" }, 404);

    } catch (err) {
      console.error("Worker error:", err);
      return json({ success: false, error: "Error interno" }, 500);
    }
  },
};
