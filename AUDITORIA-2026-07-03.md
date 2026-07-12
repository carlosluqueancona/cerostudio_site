# Auditoría integral — cerostudio.ai (3 jul 2026)

> ⚠️ NO commitear este archivo: el deploy publica todo el repo (ver hallazgo S1).

## Resumen ejecutivo

| Área | Estado | Nota |
|---|---|---|
| Errores estructurales | 🟢 Sano | 0 links rotos, 0 assets rotos, 0 títulos duplicados |
| SEO técnico | 🟠 Grave en sitemap/hreflang | El sitemap servido omite TODO /en/ y /nosotros/ |
| GEO/AEO | 🟢 Muy bien | llms.txt excelente, crawlers IA permitidos, precios en HTML |
| Rendimiento | 🟡 Bueno con fugas | Fonts render-blocking, 0 fetchpriority, 40 MB basura publicada |
| Seguridad | 🟢 Sólida | Sin secretos, sin SQLi, auth real; expone archivos internos |
| Copy SB7 | 🟡 Mixto | Casos = cliente-héroe ✓; home/nosotros = marca-héroe, sin stakes |
| UI/UX | 🟡 Fragmentado | 4 sistemas de diseño coexisten; CTAs inconsistentes |
| i18n | 🔴 Incompleto | No existe home EN; 4 de 5 casos sin EN; navbar fallback ES en páginas EN |

---

## 1. SEO técnico

### Crítico
- ~~Conflicto de sitemaps~~ **CORREGIDO EN VERIFICACIÓN**: en prod las Functions tienen precedencia — el sitemap dinámico YA servía. El gap real (confirmado en prod): **las 7 `/en/services/*` no estaban en el sitemap**. ✅ RESUELTO: añadidas al generador + `sitemap.xml` estático obsoleto eliminado.
- **`servicios/seo/` sin hreflang** (0 tags) mientras `/en/services/seo/` sí apunta de vuelta → reciprocidad rota. ✅ RESUELTO.

### Alto
- ~~og:image con casing incorrecto~~ **FALSA ALARMA (verificado en prod)**: git y prod usan `CERO_Studio_SocialShare.png` (200 OK); solo el nombre en disco local difería (macOS case-insensitive). ✅ Disco normalizado.
- **12 meta descriptions >160 chars** (seminuevos 271, servicios/seo 253, mainoflex 249, respirar 240, sergio-luque 239, en/about 236, imvec 233, en/seo 231…): se truncan en SERP.
- **Casos de éxito (Article schema) sin `datePublished`/`dateModified`** en los 5.

### Medio
- `privacidad/`: 2 H1. `blog/index.html`: 0 H1 y 0 JSON-LD (listado por JS → mala extractabilidad).
- Navbar estático solo enlaza blog y casos; el crawl de servicios depende del footer (funciona, pero el interlinking desde home al HTML crudo es débil).
- Organization schema sin `telephone`, `address`, `contactPoint`; sameAs solo Instagram (falta LinkedIn). Sin LocalBusiness.

### Correcto ✓
Canonicals absolutos en todo; titles únicos 42-86 chars; OG/Twitter completos; FAQPage con 6-8 Q&A en todas las páginas de servicio (ES y EN); BlogPosting SSR completo; Person de Carlos con E-E-A-T sólido y `worksFor → #organization`.

## 2. GEO/AEO

### Correcto ✓ (base muy fuerte)
- `llms.txt` completo (servicios ES+EN, sección AEO/GEO, posts).
- robots.txt permite todos los crawlers IA (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot).
- Precios, plazos, métricas de casos ("3x ventas" IMVEC, "+40% en 2 meses" Mainoflex, "25+ años") **en HTML estático extraíble**. Los IDs `*-price-mxn` no se sobreescriben por JS.

### Mejoras
- NAP incompleto: solo WhatsApp en HTML; añadir telephone/contactPoint/address al schema (refuerza entidad ante IA).
- FAQ solo en servicios; home y casos no tienen answer blocks.
- Listado `/blog/` invisible para extractores (render JS).

## 3. Rendimiento

1. **Fuentes**: `css/base.css:4` tiene `@import` de Google Fonts (render-blocking encadenado) Y el mismo `<link>` duplicado en HTML. Dejar un solo `<link>` (o self-host .woff2).
2. **LCP**: 0 imágenes con `fetchpriority="high"` en todo el sitio; el hero de `casos-de-exito/sergio-luque/` (línea ~376) tiene `loading="lazy"` siendo above-the-fold.
3. **Caché**: `_headers` no tiene regla para `/js/*` (home.js 62 KB sin immutable pese a usar `?v=`).
4. **Peso muerto**: ~40 MB de PNGs no referenciados que Pages publica (`sergio_luque-sitio_anterior/` con un PNG de 31 MB, `Tomate.MX-Desktop_Large@2x.png` 2.9 MB, `Agencias_Tiendanube_Partners/`, players sueltos en raíz).
5. **`?v=` inconsistente**: en `servicios/*` `base.css`/`home.css` van SIN versión; conviven fechas 0703/0614/0604.
6. `home.css` (55 KB) se carga completo en páginas de servicios que ya traen `servicios.css` (27 KB) → CSS no usado.
7. 0 `srcset` en el sitio; ~10 imgs sin width/height.
8. Verificar que HTML use `tiendanube-partner.webp` (72 KB) y `firma.webp` (32 KB), no los `.png`.

Lo que ya está bien: todos los scripts `defer`, GSAP con preload, imágenes activas en WebP ligero, `_headers` con immutable para imágenes, sin GTM/pixels pesados.

## 4. Seguridad

### Alto
- **S1 — El deploy publica todo el repo** (`wrangler.jsonc` → `pages_build_output_dir: "."`). Descargables públicamente: `blog/schema.sql`, `blog/seed.sql`, `blog/seeds/*.sql`, `blog/migrate-to-d1.js`, `formulario/cero-intake-worker/worker.js` + `SETUP.md` + `schema.sql`, `scripts/psi.sh`, docs internos. Sin secretos, pero expone esquema D1 completo y la lógica de auth del intake worker.

### Medio
- **CSP con `script-src 'unsafe-inline'`** en todas las rutas + blog SSR emite `post.content` verbatim + admin usa `innerHTML` → stored-XSS posible (acotado a admin autenticado, sin defensa en profundidad).
- **`/api/contact` sin rate-limit ni Turnstile** (solo honeypot) → spam/flood de D1 y Resend. El intake worker sí usa Turnstile: replicar.

### Bajo
- `.wrangler/state/.../metadata.sqlite` trackeado (entró antes del .gitignore) → `git rm --cached`.
- JSON i18n inyectado crudo en `<script>` inline (`functions/_middleware.js:195`, `functions/index.js:36`) — podría romper con `</script>` en contenido; escapar `<` como `<`.
- Rate-limit de login en Map in-memory por isolate (evadible entre PoPs).

### Correcto ✓
Sin secretos hardcodeados (.env ignorado, historial limpio); D1 100% con `.bind()`; JWT HS256 bien implementado (exp, timingSafeEqual, cookie HttpOnly/Secure/SameSite=Strict); CORS whitelisted; HSTS preload + XFO DENY + nosniff; Consent Mode v2 correcto; upload valida magic-bytes; cero dependencias npm (sin superficie CVE). `SECURITY-SCAN-RUNBOOK.md` es genérico de otro repo, no aplica aquí — borrarlo o moverlo.

## 5. Errores estructurales / i18n

- **No existe `/en/index.html`** — el sitio EN no tiene portada (el toggle EN del home es in-place JS, invisible para crawlers).
- Casos EN: solo `sergio-luque`. Faltan imvec, mainoflex, respirar-es-vivir, seminuevos-coapa.
- **`components/loader.js` tiene navbar/footer hardcodeados en ESPAÑOL** sin detección de idioma; si el SSR del middleware falla (D1/ASSETS down, preview local), las páginas `/en/*` muestran navbar en español.
- `blog/index.html` es la única página pública que NO carga `cookie-consent.js`.
- Todo lo demás sano: 0 links rotos, 0 assets faltantes, 404 personalizada existe, `_redirects` consistente.

## 6. Copy (StoryBrand SB7)

- **Casos de éxito: excelente SB7** — cliente-héroe en los 5 H1 ("20 años de oficio. Cero presencia.").
- **Home**: H1 outcome-focused pero el cuerpo habla en "Desarrollamos…" (marca-héroe). **Sin stakes explícitos** (qué pierde el cliente si no actúa) — el único stake claro del sitio está en tiendas ("dejar de depender de WhatsApp e Instagram").
- **Nosotros**: "Construyo sitios web que venden. Llevo haciéndolo desde antes que Google existiera." — guía-como-héroe. Fuerte en autoridad, débil en empatía (SB7: la guía muestra ambas). En una página "about" es tolerable, pero se puede girar el subhead hacia el cliente.
- **Plan de 3 pasos**: existe ("Proceso") ✓. **CTA directo + transicional**: ambos existen pero inconsistentes entre páginas.
- Prueba social: 3 testimonios reales con nombre/empresa/métrica ✓; urgency en precios ("primeros 5 clientes del mes") ✓.

## 7. UI/UX

- **CTAs inconsistentes**: home usa "Iniciar Proyecto"/"Solicitar Cotización"; servicios usan "Agendar Llamada Gratis" + "Enviar WhatsApp"; nosotros "Agendar consulta gratis". WhatsApp NO existe como CTA en home.
- **4 sistemas de diseño**: `cs-*` (casos individuales, nuevo), `ab-*` (nosotros), `csx-*` (índice casos), `lp-*` viejo (las 4 landings de servicios) + sistema bespoke del home. Pendiente conocido: migrar servicios a design language nuevo.
- Accesibilidad: alt 100% ✓, labels ✓, skip link ✓. Riesgos de contraste: `#777` sobre negro con font-weight 300 (nota de precios), y lime `#b2f700` si se usa como texto sobre claro.
- Breadcrumb visible falta en `servicios/seo/`.

---

# Plan de acción

## Fase 1 — SEO críticos (½ día, máximo impacto inmediato)
1. **Generación automática de sitemap Y llms.txt** (pedido explícito):
   - Eliminar `sitemap.xml` estático para que `functions/sitemap.xml.js` responda, y añadir las 7 `/en/services/*` (+ verificar /nosotros/, /en/about-us/, casos) al generador dinámico.
   - Crear `functions/llms.txt.js` con el mismo patrón: página estática base (servicios, casos, nosotros) + posts del blog leídos de D1, para que llms.txt nunca quede desactualizado al publicar. Eliminar el `llms.txt` estático.
   - Así ambos se regeneran solos en cada request (con cache) — no hay que tocarlos al publicar posts o casos nuevos.
2. Añadir hreflang (es-MX/en/x-default) a `servicios/seo/index.html`.
3. Corregir casing de og:image (`CERO_STUDIO_SocialShare.png`) en todas las páginas que lo referencian.
4. Acortar las 12 meta descriptions a ≤155 chars.
5. `datePublished` + `dateModified` en los 5 Article de casos.
6. `privacidad/`: dejar 1 H1. `blog/index.html`: H1 real + CollectionPage/Blog JSON-LD estático + cargar `cookie-consent.js`.

## Fase 2 — Rendimiento (½–1 día)
1. Quitar `@import` de `css/base.css:4`; dejar un solo `<link>` de fonts con preconnect (evaluar self-host woff2).
2. `fetchpriority="high"` + `loading="eager"` en el hero LCP de cada página; quitar `lazy` del hero de sergio-luque.
3. Regla `/js/*` con `max-age=31536000, immutable` en `_headers` (usan `?v=`).
4. Purgar del repo los ~40 MB de PNGs huérfanos (raíz + `sergio_luque-sitio_anterior/` + `Agencias_Tiendanube_Partners/`) — resuelve también parte de S1.
5. Unificar `?v=` en `servicios/*` (base.css/home.css sin versión hoy).
6. Confirmar uso de `.webp` para tiendanube-partner y firma; width/height en las ~10 imgs faltantes.
7. Medir antes/después con `./scripts/psi.sh`.

## Fase 3 — Seguridad (½ día)
1. Sacar del deploy los archivos internos (SQL schemas/seeds, worker.js, SETUP.md, scripts/, docs): moverlos a carpeta excluida o servir 404 vía `_redirects`; idealmente reestructurar output dir.
2. Turnstile + rate-limit en `/api/contact` (patrón ya existe en el intake worker).
3. `git rm --cached` del sqlite de `.wrangler` + reforzar .gitignore.
4. Escapar `<` → `<` en el JSON i18n inyectado (`functions/_middleware.js:195`, `functions/index.js:36`).
5. Borrar/mover `SECURITY-SCAN-RUNBOOK.md` (es de otro repo).
6. (Medio plazo) plan para retirar `unsafe-inline` de CSP con nonces/hashes en el SSR.

## Fase 4 — GEO/entidad (½ día)
1. Organization schema: `telephone` (+52 55 3100 7101), `contactPoint`, `address` (o LocalBusiness si aplica), sameAs completo (Instagram + LinkedIn).
2. FAQ + FAQPage schema en home (reusar patrón de servicios).
3. Fallback i18n de `components/loader.js`: detectar `/en/` y servir navbar/footer EN.

## Fase 5 — i18n EN (1–2 días)
1. Crear `/en/index.html` (home EN estática real — hoy el inglés solo existe vía toggle JS, invisible para Google e IA).
2. Versiones EN de los 4 casos faltantes + actualizar hreflang recíproco y sitemap.

## Fase 6 — Copy SB7 + UI/UX (proyecto creativo, worktree)
1. Home: inyectar stakes explícitos (sección "el costo de no actuar") y girar cuerpo de "Desarrollamos" a tú-cliente; añadir CTA WhatsApp.
2. Unificar sistema de CTAs sitewide: 1 directo ("Iniciar Proyecto") + 1 transicional ("Agendar llamada gratis") consistentes.
3. Nosotros: subhead con empatía antes de autoridad.
4. Migrar las 4 landings de servicios de `.lp-*` al design language nuevo (pendiente ya registrado; worktree separado).
5. Contraste: subir `#777`/weight 300 en notas de precios; auditar usos de lime sobre claro.

> Reglas operativas: tocar #precios ⇒ actualizar i18n en js/home.js + bump `?v=`. Nada de push sin OK explícito. Fase 6 en worktree.
