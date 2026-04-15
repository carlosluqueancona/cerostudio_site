/**
 * CERO STUDIO — Intake Brief Worker
 * Cloudflare Worker + D1 Database
 * 
 * Receives client brief submissions, stores in D1, 
 * and sends email notification via MailChannels (free on CF Workers).
 * 
 * SETUP:
 * 1. Create D1 database:    wrangler d1 create cero-intake
 * 2. Run migrations:        wrangler d1 execute cero-intake --file=./schema.sql
 * 3. Deploy worker:         wrangler deploy
 * 4. Set up custom domain:  intake.cerostudio.ai (optional)
 */

export default {
  async fetch(request, env) {
    // ─── CORS headers ───
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // In production, restrict to cerostudio.ai
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // ─── POST /submit — New brief submission ───
    if (request.method === "POST" && url.pathname === "/submit") {
      try {
        const body = await request.json();

        // Validate required fields
        if (!body.name || !body.email || !body.phone) {
          return Response.json(
            { success: false, error: "Campos requeridos: name, email, phone" },
            { status: 400, headers: corsHeaders }
          );
        }

        // Generate brief ID
        const briefId = `CS-${Date.now().toString(36).toUpperCase()}`;

        // Insert into D1
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
          body.name || null,
          body.email || null,
          body.phone || null,
          body.company || null,
          body.lang || null,
          body.businessName || null,
          body.industry || null,
          body.location || null,
          body.targetAudience || null,
          body.competitors || null,
          body.usp || null,
          JSON.stringify(body.projectType || []),
          body.currentSite || null,
          body.currentSitePain || null,
          JSON.stringify(body.pages || []),
          JSON.stringify(body.features || []),
          body.ecommProducts || null,
          JSON.stringify(body.visualDirection || []),
          body.referenceSites || null,
          body.avoidance || null,
          body.hasLogo || null,
          body.hasBrandColors || null,
          body.brandColorsDetail || null,
          body.contentStatus || null,
          body.photoStatus || null,
          JSON.stringify(body.hasExistingContent || []),
          body.contentNotes || null,
          body.goal || null,
          body.budget || null,
          body.timeline || null,
          body.deadlineDetail || null,
          body.maintenance || null,
          body.additionalNotes || null,
          body.briefText || null,
        ).run();

        // ─── Send email notification via MailChannels ───
        try {
          await fetch("https://api.mailchannels.net/tx/v1/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              personalizations: [
                {
                  to: [{ email: "hola@cerostudio.ai", name: "Cero Studio" }],
                },
              ],
              from: {
                email: "intake@cerostudio.ai",
                name: "Cero Studio Intake",
              },
              subject: `◉ Nuevo Brief ${briefId} — ${body.businessName || body.name}`,
              content: [
                {
                  type: "text/plain",
                  value: [
                    `NUEVO BRIEF DE PROYECTO: ${briefId}`,
                    `═══════════════════════════════════════`,
                    ``,
                    `Cliente: ${body.name}`,
                    `Email: ${body.email}`,
                    `Teléfono: ${body.phone}`,
                    `Negocio: ${body.businessName || "—"}`,
                    `Industria: ${body.industry || "—"}`,
                    `Ubicación: ${body.location || "—"}`,
                    ``,
                    `Tipo de proyecto: ${(body.projectType || []).join(", ")}`,
                    `Presupuesto: ${body.budget || "—"}`,
                    `Timeline: ${body.timeline || "—"}`,
                    ``,
                    `═══════════════════════════════════════`,
                    `Ver brief completo en el dashboard o en D1.`,
                    ``,
                    body.briefText || "",
                  ].join("\n"),
                },
              ],
            }),
          });
        } catch (emailErr) {
          // Don't fail the submission if email fails
          console.error("Email notification failed:", emailErr);
        }

        return Response.json(
          { success: true, briefId },
          { status: 201, headers: corsHeaders }
        );

      } catch (err) {
        console.error("Submit error:", err);
        return Response.json(
          { success: false, error: "Error al guardar el brief" },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // ─── GET /briefs — List all briefs (protected) ───
    if (request.method === "GET" && url.pathname === "/briefs") {
      // Simple API key auth — replace with something stronger in production
      const authKey = request.headers.get("X-API-Key");
      if (authKey !== env.ADMIN_API_KEY) {
        return Response.json(
          { error: "No autorizado" },
          { status: 401, headers: corsHeaders }
        );
      }

      const { results } = await env.DB.prepare(
        "SELECT * FROM briefs ORDER BY submitted_at DESC LIMIT 50"
      ).all();

      return Response.json(
        { success: true, briefs: results },
        { headers: corsHeaders }
      );
    }

    // ─── GET /briefs/:id — Single brief (protected) ───
    if (request.method === "GET" && url.pathname.startsWith("/briefs/")) {
      const authKey = request.headers.get("X-API-Key");
      if (authKey !== env.ADMIN_API_KEY) {
        return Response.json(
          { error: "No autorizado" },
          { status: 401, headers: corsHeaders }
        );
      }

      const id = url.pathname.split("/briefs/")[1];
      const brief = await env.DB.prepare(
        "SELECT * FROM briefs WHERE brief_id = ?1"
      ).bind(id).first();

      if (!brief) {
        return Response.json(
          { error: "Brief no encontrado" },
          { status: 404, headers: corsHeaders }
        );
      }

      return Response.json(
        { success: true, brief },
        { headers: corsHeaders }
      );
    }

    // ─── PATCH /briefs/:id/status — Update status (protected) ───
    if (request.method === "PATCH" && url.pathname.match(/\/briefs\/.*\/status/)) {
      const authKey = request.headers.get("X-API-Key");
      if (authKey !== env.ADMIN_API_KEY) {
        return Response.json(
          { error: "No autorizado" },
          { status: 401, headers: corsHeaders }
        );
      }

      const id = url.pathname.split("/briefs/")[1].split("/status")[0];
      const { status } = await request.json();
      const validStatuses = ["new", "reviewed", "proposal_sent", "approved", "in_progress", "delivered", "archived"];

      if (!validStatuses.includes(status)) {
        return Response.json(
          { error: `Status inválido. Opciones: ${validStatuses.join(", ")}` },
          { status: 400, headers: corsHeaders }
        );
      }

      await env.DB.prepare(
        "UPDATE briefs SET status = ?1 WHERE brief_id = ?2"
      ).bind(status, id).run();

      return Response.json(
        { success: true, briefId: id, status },
        { headers: corsHeaders }
      );
    }

    return Response.json(
      { error: "Not found", endpoints: ["POST /submit", "GET /briefs", "GET /briefs/:id", "PATCH /briefs/:id/status"] },
      { status: 404, headers: corsHeaders }
    );
  },
};
