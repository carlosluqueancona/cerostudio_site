# Graph Report - .  (2026-06-07)

## Corpus Check
- 139 files · ~306,768 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 332 nodes · 422 edges · 55 communities (31 shown, 24 thin omitted)
- Extraction: 85% EXTRACTED · 15% INFERRED · 0% AMBIGUOUS · INFERRED: 62 edges (avg confidence: 0.86)
- Token cost: 0 input · 308,793 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Client Portal & Brief API|Client Portal & Brief API]]
- [[_COMMUNITY_Auth & Portal Middleware|Auth & Portal Middleware]]
- [[_COMMUNITY_Portfolio & Messages CMS API|Portfolio & Messages CMS API]]
- [[_COMMUNITY_Services, Intake & Design System|Services, Intake & Design System]]
- [[_COMMUNITY_Site Chrome & Brand Tokens|Site Chrome & Brand Tokens]]
- [[_COMMUNITY_Homepage Hero Animation|Homepage Hero Animation]]
- [[_COMMUNITY_Intake Form Component (JSX)|Intake Form Component (JSX)]]
- [[_COMMUNITY_Blog SPA Router|Blog SPA Router]]
- [[_COMMUNITY_Cero Studio Brand Marks|Cero Studio Brand Marks]]
- [[_COMMUNITY_SSR Portfolio Middleware|SSR Portfolio Middleware]]
- [[_COMMUNITY_Contact Form Endpoint|Contact Form Endpoint]]
- [[_COMMUNITY_Blog Index SSR|Blog Index SSR]]
- [[_COMMUNITY_Blog Article SSR|Blog Article SSR]]
- [[_COMMUNITY_Cookie Consent & GTM|Cookie Consent & GTM]]
- [[_COMMUNITY_Patitas Pet Brand Logos|Patitas Pet Brand Logos]]
- [[_COMMUNITY_D1 Migration Script|D1 Migration Script]]
- [[_COMMUNITY_Blog Posts API|Blog Posts API]]
- [[_COMMUNITY_Brief Intake Forms|Brief Intake Forms]]
- [[_COMMUNITY_Sitemap Generator|Sitemap Generator]]
- [[_COMMUNITY_Founder Portrait & Signature|Founder Portrait & Signature]]
- [[_COMMUNITY_E-commerce Portfolio Sites|E-commerce Portfolio Sites]]
- [[_COMMUNITY_Loader & Navbar Scroll|Loader & Navbar Scroll]]
- [[_COMMUNITY_INEGI Census Logos|INEGI Census Logos]]
- [[_COMMUNITY_Salvaxe Logo Variants|Salvaxe Logo Variants]]
- [[_COMMUNITY_Industrial B2B Portfolio|Industrial B2B Portfolio]]
- [[_COMMUNITY_Wellness & Training Portfolio|Wellness & Training Portfolio]]
- [[_COMMUNITY_Capital Pirata Logo|Capital Pirata Logo]]
- [[_COMMUNITY_CICAP Logo Variants|CICAP Logo Variants]]
- [[_COMMUNITY_Edecanes Pachuca Logo|Edecanes Pachuca Logo]]
- [[_COMMUNITY_KARUM Logo Variants|KARUM Logo Variants]]
- [[_COMMUNITY_MAINOFLEX Logo Variants|MAINOFLEX Logo Variants]]
- [[_COMMUNITY_Neurótica.FM Logo|Neurótica.FM Logo]]
- [[_COMMUNITY_Centro Samadi Logo|Centro Samadi Logo]]
- [[_COMMUNITY_Trión Logo Variants|Trión Logo Variants]]
- [[_COMMUNITY_PSI Speed Test Script|PSI Speed Test Script]]
- [[_COMMUNITY_Balo Logo|Balo Logo]]
- [[_COMMUNITY_AHCD Hotels Seal|AHCD Hotels Seal]]
- [[_COMMUNITY_El Baúl de Roci Logo|El Baúl de Roci Logo]]
- [[_COMMUNITY_Impresiones 2M Logo|Impresiones 2M Logo]]
- [[_COMMUNITY_IMVEC Emblem|IMVEC Emblem]]
- [[_COMMUNITY_CDMX Government Logo|CDMX Government Logo]]
- [[_COMMUNITY_Radio Fórmula Logo|Radio Fórmula Logo]]
- [[_COMMUNITY_UNODC Logo|UNODC Logo]]
- [[_COMMUNITY_Edecanes Pachuca Site|Edecanes Pachuca Site]]
- [[_COMMUNITY_2M Impresiones Site|2M Impresiones Site]]
- [[_COMMUNITY_Modelle Agency Site|Modelle Agency Site]]
- [[_COMMUNITY_Respirar es Vivir Clinic Site|Respirar es Vivir Clinic Site]]

## God Nodes (most connected - your core abstractions)
1. `requireAuth()` - 20 edges
2. `parseId()` - 13 edges
3. `corsHeaders()` - 11 edges
4. `json()` - 9 edges
5. `llms.txt — AI Crawler Site Manifest` - 9 edges
6. `verifyJWT()` - 8 edges
7. `extractToken()` - 7 edges
8. `onRequestPost()` - 7 edges
9. `onRequestPut()` - 7 edges
10. `Footer Component (English)` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Diseño Web para Clínicas y Consultorios Médicos (Spanish)` --semantically_similar_to--> `Web Design for Clinics & Medical Practices (English)`  [INFERRED] [semantically similar]
  diseno-web-para-clinicas/index.html → en/services/clinic-website-design/index.html
- `EN Web Development Service Page` --semantically_similar_to--> `Desarrollo Web Service Page (ES)`  [INFERRED] [semantically similar]
  en/services/web-development/index.html → servicios/desarrollo-web/index.html
- `EN Web Maintenance Service Page` --semantically_similar_to--> `Mantenimiento Web Service Page (ES)`  [INFERRED] [semantically similar]
  en/services/web-maintenance/index.html → servicios/mantenimiento/index.html
- `Portal Cliente — Extracted Intake Setup Guide` --semantically_similar_to--> `Cero Intake System Setup Guide`  [INFERRED] [semantically similar]
  portal_cliente/extracted/cero-intake-worker/SETUP.md → formulario/cero-intake-worker/SETUP.md
- `Tu Proyecto — Client Project Page (noindex,nofollow)` --semantically_similar_to--> `Portal Cliente — Extracted Project Portal Template`  [INFERRED] [semantically similar]
  proyecto/index.html → portal_cliente/extracted/cero-intake-worker/portal.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cero Studio Service Pages (shared layout: stat hook, deliverables, timeline, FAQ)** — clinic_website_design_page, digital_branding_page, digital_consulting_page, online_stores_page, seo_index_page [INFERRED 0.85]
- **Bilingual Site Chrome (EN/ES navbar + footer components)** — components_navbar, components_navbar_en, components_footer, components_footer_en [INFERRED 0.85]
- **Brief Intake Pipeline (EN/ES form → multi-step flow → admin review)** — brief_index_page, brief_en_index_page, brief_index_multistep_flow, brief_admin_page [INFERRED 0.85]
- **Cero Studio Intake Pipeline (Form to Worker to D1 to Email)** — cloudflare_worker_intake, cloudflare_d1_briefs, mailchannels_notification, proyecto_client_project_page [INFERRED 0.85]
- **Bilingual Service Page Set (ES + EN)** — desarrollo_web_es_service_page, web_development_en_service_page, mantenimiento_es_service_page, web_maintenance_en_service_page, llms_txt [INFERRED 0.75]
- **Kinetic Brutalism Design Tokens** — design_kinetic_brutalism, design_no_line_rule, design_neon_palette, design_typography_space_grotesk_inter [EXTRACTED 1.00]
- **Cero Studio Bullseye Favicon Variant Set** — apple_touch_icon, favicon_192, favicon_96, favicon, images_cs_favicon, images_svg_cs_favicon [INFERRED 0.85]
- **Cero Studio Brand Identity System (mark, wordmarks, social card)** — images_svg_cs_favicon, images_svg_cero_studio_ai, images_svg_cero_studio_ai_horizontal, images_cero_studio_socialshare [INFERRED 0.85]
- **Cero Studio client/partner logo credibility ticker** — logos_ticker_balo_web_menu_ticker, logos_ticker_cdmx_ahcd, logos_ticker_cicap_logo_negro_1000px_png, logos_ticker_cicap_logo_negro_1000px_webp, logos_ticker_capital_pirata_png, logos_ticker_capital_pirata_webp, logos_ticker_censo202_logo, logos_ticker_censo_pyv_2010, logos_ticker_edecanes_pachuca_logo_vertical_path_png, logos_ticker_edecanes_pachuca_logo_vertical_path_webp, logos_ticker_el_baul_de_roci_negro, logos_ticker_imvec, logos_ticker_inegi_1000px, logos_ticker_impresiones2m_negro [INFERRED 0.75]
- **Client/Partner Logo Credibility Ticker** — logos_ticker_impresiones2m_negro, logos_ticker_karum_logo_4x_png, logos_ticker_karum_logo_4x_webp, logos_ticker_logo_cdmx, logos_ticker_mainoflex_logo_final_alto_contrste_1000px_png, logos_ticker_mainoflex_logo_final_alto_contrste_1000px_webp, logos_ticker_neurotica_fm_png, logos_ticker_neurotica_fm_webp, logos_ticker_pf_logo_negro_1000px, logos_ticker_pf_logo_negro, logos_ticker_pf, logos_ticker_pp, logos_ticker_pp_logo_negro_1000px, logos_ticker_pp_logo_negro [INFERRED 0.75]
- **Cero Studio Client Logo Credibility Ticker** — logos_ticker_radioformula_200px, logos_ticker_samadi_logo_horizontal_negro_1000px_png, logos_ticker_samadi_logo_horizontal_negro_1000px_webp, logos_ticker_salvaxe_1500px, logos_ticker_salvaxe_png, logos_ticker_salvaxe_webp, logos_ticker_unodc_500px, logos_ticker_trion_blanco2_png, logos_ticker_trion_blanco2_webp [INFERRED 0.75]
- **Cero Studio Portfolio Projects** — portafolio_avicultura_estrategica_screenshot, portafolio_centro_psibori_screenshot, portafolio_cicap_screenshot, portafolio_edecanespachuca_screenshot, portafolio_impresiones2m_screenshot, portafolio_imvec_screenshot, portafolio_mainoflex_screenshot, portafolio_marz_mercurium_screenshot [INFERRED 0.85]
- **Cero Studio Portfolio Sites** — portafolio_modelle_screenshot, portafolio_myr_screenshot, portafolio_patitasfelinas_screenshot, portafolio_patitaspeludas_screenshot, portafolio_respiraresvivir_screenshot, portafolio_seminuevoscoapa_screenshot [INFERRED 0.85]

## Communities (55 total, 24 thin omitted)

### Community 0 - "Client Portal & Brief API"
Cohesion: 0.07
Nodes (17): ALLOWED_ORIGINS, buildCorsHeaders(), checkRateLimit(), handlePaymentDelete(), handlePaymentMain(), handlePaymentUpdate(), handleSubmit(), recalcPaid() (+9 more)

### Community 1 - "Auth & Portal Middleware"
Cohesion: 0.13
Nodes (20): checkLoginRateLimit(), onRequestPost(), timingSafeEqual(), onRequestGet(), applyCors(), onRequest(), PUBLIC_PATHS, ALLOWED_ORIGINS (+12 more)

### Community 2 - "Portfolio & Messages CMS API"
Cohesion: 0.16
Nodes (23): onRequestDelete(), onRequestGet(), onRequestPatch(), buildI18nJSON(), buildPortfolioHTML(), normalizeServiceTags(), onRequestDelete(), onRequestGet() (+15 more)

### Community 3 - "Services, Intake & Design System"
Cohesion: 0.08
Nodes (29): Branding Digital Service Page (ES), Cero Intake Architecture (Worker + D1 + MailChannels), Cero Intake System Setup Guide, Cero Studio Organization (Schema @id #organization), Cloudflare D1 Database (briefs table), Cloudflare Worker (intake.cerostudio.ai), Consultoria Digital Service Page (ES), Desarrollo Web Service Page (ES) (+21 more)

### Community 4 - "Site Chrome & Brand Tokens"
Cohesion: 0.10
Nodes (25): Cero Studio Brand Design Tokens (lime #b2f700, Space Grotesk, Inter, dark #131313), 404 Error Page (Página no encontrada), Carlos Luque Ancona (Founder, Cero Studio), About — Carlos Luque Ancona, Founder (English), Cero Studio Blog Admin Panel, Light/Dark Theme Token System (body.light overrides), Cero Studio Admin Panel, Blog Listing Page (Diseño Web, Marketing Digital y SEO) (+17 more)

### Community 5 - "Homepage Hero Animation"
Cohesion: 0.12
Nodes (10): clearFeedback(), draw(), field(), handleSubmit(), renderFrame(), setFeedback(), setLang(), TextScramble (+2 more)

### Community 6 - "Intake Form Component (JSX)"
Cohesion: 0.17
Nodes (3): BRAND, FIELDS, STEPS

### Community 7 - "Blog SPA Router"
Cohesion: 0.29
Nodes (7): formatDate(), handleRoute(), initBlog(), navigate(), postCardHtml(), renderList(), renderPost()

### Community 8 - "Cero Studio Brand Marks"
Cohesion: 0.24
Nodes (10): Apple Touch Icon (Cero Studio bullseye mark, rounded PNG), Favicon (Cero Studio bullseye mark, SVG), Favicon 192px (Cero Studio bullseye mark PNG), Favicon 96px (Cero Studio bullseye mark PNG), Cero Studio Social Share Card (CERO STUDIO.AI wordmark on black), Cero Studio Favicon (bullseye mark PNG), Cero Studio.AI Wordmark Logo (stacked, SVG), Cero Studio.AI Wordmark Logo (horizontal, SVG) (+2 more)

### Community 9 - "SSR Portfolio Middleware"
Cohesion: 0.29
Nodes (9): _cache, detectLang(), detectServiceTag(), loadPartial(), loadServicePortfolio(), onRequest(), PARTIALS, _portfolioCache (+1 more)

### Community 10 - "Contact Form Endpoint"
Cohesion: 0.48
Nodes (6): ALLOWED_ORIGINS, corsHeaders(), json(), onRequestOptions(), onRequestPost(), sendNotification()

### Community 11 - "Blog Index SSR"
Cohesion: 0.48
Nodes (6): buildListHtml(), escAttr(), escHtml(), formatDateEsMx(), onRequest(), postCardHtml()

### Community 12 - "Blog Article SSR"
Cohesion: 0.52
Nodes (6): absoluteUrl(), buildArticleHtml(), escAttr(), formatDateEsMx(), onRequest(), toIsoDate()

### Community 14 - "Patitas Pet Brand Logos"
Cohesion: 0.33
Nodes (6): Patitas Felinas logo (PF), Patitas Felinas logo (black, WEBP), Patitas Felinas logo (black, PNG), Patitas Peludas logo (PP), Patitas Peludas logo (black, WEBP), Patitas Peludas logo (black, PNG)

### Community 15 - "D1 Migration Script"
Cohesion: 0.40
Nodes (4): fs, jsonPath, outputPath, path

### Community 16 - "Blog Posts API"
Cohesion: 0.67
Nodes (3): HEADERS, json(), onRequestGet()

### Community 17 - "Brief Intake Forms"
Cohesion: 0.83
Nodes (4): Admin Briefs Panel (Panel de Briefs), Project Brief Form (English), Multi-Step Brief Flow (Contact, Project, Timeline & Budget), Brief de Proyecto Form (Spanish)

### Community 19 - "Founder Portrait & Signature"
Cohesion: 0.50
Nodes (4): Carlos Luque Ancona 2026 Portrait (B&W), Carlos Luque Signature (PNG), Carlos Luque Signature (WebP), Tomate.MX Bio/About Page Mockup (Desktop)

### Community 20 - "E-commerce Portfolio Sites"
Cohesion: 0.50
Nodes (4): MyR - fabricante de estanterias y exhibidores metalicos, Patitas Felinas - e-commerce de productos para gatos, Patitas Peludas - e-commerce de productos para mascotas, Seminuevos Coapa - agencia de autos seminuevos

### Community 23 - "INEGI Census Logos"
Cohesion: 1.00
Nodes (3): Censo de Población y Vivienda 2020 (INEGI) house-with-person logo, Censo de Población y Vivienda 2010 (INEGI) house-with-person logo, INEGI (Instituto Nacional de Estadística y Geografía) logo

### Community 24 - "Salvaxe Logo Variants"
Cohesion: 1.00
Nodes (3): Salvaxe logo (1500px, gorilla mark), Salvaxe logo (PNG, gorilla mark), Salvaxe logo (WEBP, gorilla mark)

### Community 25 - "Industrial B2B Portfolio"
Cohesion: 0.67
Nodes (3): Avicultura Estratégica website, IMVEC website, Mainoflex website

### Community 26 - "Wellness & Training Portfolio"
Cohesion: 0.67
Nodes (3): Centro Psibori website, CICAP website, Marz Mercurium website

## Ambiguous Edges - Review These
- `Tomate.MX Bio/About Page Mockup (Desktop)` → `Carlos Luque Ancona 2026 Portrait (B&W)`  [AMBIGUOUS]
  Tomate.MX-Desktop_Large@2x.png · relation: conceptually_related_to

## Knowledge Gaps
- **82 isolated node(s):** `fs`, `path`, `jsonPath`, `outputPath`, `ALLOWED_ORIGINS` (+77 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Tomate.MX Bio/About Page Mockup (Desktop)` and `Carlos Luque Ancona 2026 Portrait (B&W)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `requireAuth()` connect `Portfolio & Messages CMS API` to `Auth & Portal Middleware`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `corsHeaders()` connect `Auth & Portal Middleware` to `Portfolio & Messages CMS API`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `fs`, `path`, `jsonPath` to the rest of the system?**
  _83 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Client Portal & Brief API` be split into smaller, more focused modules?**
  _Cohesion score 0.07394957983193277 - nodes in this community are weakly interconnected._
- **Should `Auth & Portal Middleware` be split into smaller, more focused modules?**
  _Cohesion score 0.12688172043010754 - nodes in this community are weakly interconnected._
- **Should `Services, Intake & Design System` be split into smaller, more focused modules?**
  _Cohesion score 0.0812807881773399 - nodes in this community are weakly interconnected._