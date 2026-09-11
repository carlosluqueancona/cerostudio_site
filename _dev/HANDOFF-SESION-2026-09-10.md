# Handoff para agentes · cerostudio.ai
**Sesión:** 6 al 10 de septiembre de 2026 · **Escrito:** 11 sep 2026
**Para:** cualquier agente (Claude, Codex, GPT) que retome trabajo en este repo.

> Este documento es el **estado vigente**. Supera a `_dev/HANDOFF-IMPLEMENTACION-2026-09-07.md`
> (sigue siendo útil como contexto técnico, secciones 6-8) y complementa a
> `_dev/PENDIENTES-VENTAS-2026-09-09.md` (lista viva con casillas; ver advertencias en §7).

---

## 0. Orden de lectura

1. Este documento completo (§1 a §3 son obligatorios antes de tocar nada).
2. `_dev/PENDIENTES-VENTAS-2026-09-09.md` para la lista de pendientes con casillas.
3. `_dev/HANDOFF-IMPLEMENTACION-2026-09-07.md` §6-8 solo si necesitas historia técnica.

---

## 1. Estado al cierre

- **Todo está en producción.** `main` = `origin/main`. Último commit: `23a8829`.
- Deploy = `git push origin main` → Cloudflare Pages lo publica solo en ~1-2 min. No hay CI ni wrangler de por medio.
- El árbol de trabajo solo tiene archivos sin rastrear que **no son de esta sesión** (`.agents/`, `.codex/`,
  `AUDITORIA-2026-07-03.md`, `Qwen_markdown_*.md`, un retrato `.webp`, una captura de Seminuevos Coapa).
  No los agregues a ningún commit. Usa siempre staging selectivo (`git add <archivos>`), nunca `git add -A`.
- La regeneración del caché del portafolio (§5.6) **ya se hizo**: verificado el 11 sep, 0 flechas sueltas en `/` y `/en/`.

---

## 2. Reglas que no se negocian

Vienen directamente de Carlos Luque (fundador, dueño del repo). Romperlas cuesta confianza.

| Regla | Detalle |
|---|---|
| **No mencionar su compañía anterior** | Nunca, en ningún contexto. |
| **Nunca borrar archivos** | Todo retiro: copiar el original a `_archivo/<motivo-fecha>/` con un LEEME, y luego `git rm`. |
| **No inventar** | Ni métricas, ni testimonios, ni fuentes, ni fechas, ni credenciales. |
| **No publicar precios que nunca se cobraron** | Por eso se retiró el precio regular tachado. |
| **"Premium" no se usa como autodescripción** | *"Decir que algo es premium es lo menos premium que podemos decir."* El plan se sigue llamando **Cero Premium**; lo que se prohíbe es describir a Cero Studio como "premium". |
| **Sin cejas numeradas en el home** | *"No me gustan las cejas. Diseño por AI."* Regla en `css/home.css` (`.eyebrow:not(.eyebrow-alert) { display:none }`). Se conserva la roja de `#stakes` y la del hero. |
| **Avisar antes de publicar** | Push a `main` = producción. Pide OK explícito salvo que Carlos diga "publica" en ese mensaje. |
| **Copy del hero: opinión antes de cambiar** | *"Antes de modificar algo dime tu opinión sincera."* Propón, espera aprobación, luego aplica. |
| **La palabra rotativa y el scramble del H1** | *"Amo la palabra rotativa, no la toques, ni el scramble."* El efecto no se toca. La lista de palabras solo cambia con su aprobación. |
| **Español de México** | Chat, commits y copy en ES-MX natural. |
| **Excelencia, sin atajos** | No ofrecer "versión mínima" como alternativa. Hacer la solución completa. |
| **Copy con StoryBrand SB7** | Cliente = héroe, Carlos = guía, idea de control "sitios que venden". |

**Contexto de negocio que no hay que volver a preguntar:**
- Cero Studio **arrancó a principios de abril de 2026**. No lleva 12 meses operando. (Se le preguntó tres veces; no lo repitas.)
- Carlos corrió él mismo la campaña de optimización para búsqueda con IA. No asumas que "ignora" esa señal del mercado.
- Una PyME mexicana difícilmente paga más de $1,000 MXN/mes de mantenimiento. Esa fue la base de los dos niveles de §5.1.
- El proyecto **Atlas** (bot multi-tenant de WhatsApp) vive en **otro repo**, con piloto en Spacial Arquitectos. No se desarrolla aquí.

---

## 3. Arquitectura que muerde

Estos son los puntos donde un cambio "correcto" se pierde sin que te des cuenta.

### 3.1 El mismo texto vive en TRES lugares
1. **HTML estático**: `index.html` y `en/index.html`.
2. **Diccionarios i18n** en `js/home.js` (claves por `id`, `t:` texto / `h:` HTML). **Sobrescriben el HTML en runtime** vía `setLang()`. Si cambias el HTML y no el diccionario, el cambio desaparece al cargar.
3. **HTML pre-generado en D1** (`site_cache`): las tarjetas del portafolio las arma `buildPortfolioHTML()` en `functions/api/admin/portfolio.js` y se guardan ya renderizadas. Cambiar el código **no actualiza** lo guardado. Hay que regenerarlo desde `/blog/admin/` → Portafolio → **"↻ Publicar cambios"** (requiere sesión de admin; lo hace Carlos).

Además hay un caché en memoria de 60 s (`PORTFOLIO_CACHE_TTL_MS` en `functions/_middleware.js`).

### 3.2 CSP sin `unsafe-inline`
`script-src 'self' …`. Los scripts en línea y los `onclick` inline se bloquean **en silencio**. Datos para el cliente → bloque `<script type="application/json">`, nunca un script ejecutable en línea. Así se rompió el i18n del portafolio de julio a septiembre.

### 3.3 El blog tiene su propio CSS
`blog/index.html` **no carga `css/home.css`**. Todo arreglo de navbar, menú o botón de idioma debe repetirse en `blog/blog.css`. Los artículos sirven el mismo `blog/index.html`.

### 3.4 CTA de artículos: doble render
`blog/blog.js` y `functions/blog/[slug].js` tienen el mismo markup (cliente y SSR). Se editan **siempre juntos** y deben quedar idénticos.

### 3.5 Cache-busting con `?v=`
Al tocar `css/home.css` sube el `?v=` en **las 37 páginas** que lo cargan (todas deben quedar con el mismo valor). Al tocar `js/home.js`, en `index.html` y `en/index.html`. `blog/blog.css` y `blog/blog.js` se versionan en `blog/index.html`.
Versiones al cierre: `home.css?v=20260909l` · `home.js?v=20260909j` · `blog.css?v=20260909d` · `blog.js?v=20260909a`.
`components/cookie-consent.js` **no lleva `?v=`**.

### 3.6 El idioma lo define la URL
`/` = español, `/en/` = inglés, y cada página lo declara en `<html lang>`. Todo componente que necesite idioma debe leer `<html lang>` primero, no `localStorage` ni el navegador.

### 3.7 Otras trampas conocidas
- `#loader` existe **solo en la home**. `components/loader.js` (el script) sí es obligatorio en internas.
- **Nunca** `opacity:0` en `.hero-static-title`: rompe el LCP.
- `/_dev/*` no se sirve públicamente.
- Cloudflare devuelve **403 al User-Agent de Python**. Para verificar producción con `urllib` manda un UA de navegador y `?cb=<timestamp>`.
- `curl`, `wget` y WebFetch pueden estar bloqueados en este entorno; usa `/usr/bin/python3` + `urllib`.
- Wrangler: anteponer `env -u CLOUDFLARE_API_TOKEN` (el token del entorno no tiene permisos de Pages).

---

## 4. Precios publicados (verificados en `index.html` el 11 sep)

| Oferta | Precio |
|---|---|
| Cero Launch | $299 USD (≈ $5,400 MXN), entrega en 5 días hábiles |
| Cero Pro | $999 USD (≈ $17,900 MXN), el más solicitado |
| Cero Premium | Desde $1,800 USD (desde ≈ $32,000 MXN), cotización personalizada |
| Mantenimiento Launch | $1,000 MXN/mes, una página, hasta 2 cambios de contenido, sin contrato anual |
| Mantenimiento Pro | $1,500 MXN/mes, 4-6 páginas o blog, ajustes de estructura; aplica a Cero Pro y Cero Premium |
| Tienda Esencial / Pro / Premium (Tiendanube) | $6,000 / $12,000 / $22,000 MXN |

**Regla de moneda:** proyectos anclados en USD con `≈ $X MXN` en español usando tasas fijas de la casa (299→5,400 · 499→8,900 · 999→17,900 · 1,800→32,000). No recalcular con el tipo de cambio del día. Recurrentes y Tiendanube en MXN. `/en/` solo USD.

Urgencia vigente: *"Precios de este trimestre. Tomamos 5 proyectos nuevos al mes."*

---

## 5. Lo que se decidió y aplicó en esta sesión

### 5.1 Precios y planes
- Mantenimiento en **dos niveles** ($1,000 Launch / $1,500 Pro). Antes llegó a haber $800 / $3,500 y luego un solo plan de $1,500; ambos quedaron atrás.
- Bullet de **búsqueda con IA** incluido y visible en Cero Launch ("Listo para búsquedas con IA") y Cero Pro ("Optimizado para búsquedas con IA").
- Fuera "premium" como autodescripción en título, meta, redes y schema. Fuera el precio regular tachado y las líneas de "Ahorras".

### 5.2 Hero del home
- **Subtítulo ES:** *Ahora mismo alguien busca lo que tú vendes. Construimos el sitio que hace que te elija a ti.*
- **Subtítulo EN:** *Right now someone is searching for what you sell. We build the site that makes them choose you.*
  - Razón: el cliente no busca el nombre del negocio, busca lo que resuelve su necesidad.
  - No es traducción literal, a propósito. Sin precio en el hero (*"estás mostrando los calzones en el hero"*).
  - `text-wrap: balance` para evitar viudas.
- **Fuera la línea chiquita de credenciales** (`#heroProof`). Sus cuatro argumentos siguen en "Por qué Cero" y en el sello Tiendanube.
- **Ceja** "Clientes, no solo visitas.": 13px, `letter-spacing .18em`, peso 500, regla lime de 48px (antes 10px / .4em / 400).
- **Palabras rotativas** (`js/home.js`, `HERO_WORDS`):
  - ES: `VENDE. → ATRAE. → CIERRA. → COBRA.`
  - EN: `SELLS. → BOOKS. → WINS. → EARNS.`
  - El ciclo arranca a **1200 ms** e intervalo de **2500 ms** (antes 2200 / 3400: la segunda palabra aparecía hacia el segundo 7 y el embudo era invisible).
  - **Regla 1:** cada palabra debe sostenerse sola; casi nadie ve el ciclo completo.
  - **Regla 2:** máximo 7 caracteres en ES y 6 en EN. `fit()` descarta la que no cabe, y el renglón más apretado es **desktop** (la tipografía llega a 230 px), no el celular. Medido en 6 viewports: `CONVENCE.`, `ATTRACTS.`, `CONVINCES.`, `CLOSES.`, `WORKS.`, `AGENDA.` no caben.
  - Cualquier cambio a la lista requiere aprobación de Carlos. Candidatas medidas que **sí caben en los 6 viewports**: ES `RINDE.`, `CRECE.` · EN `SELLS.`, `BOOKS.`, `EARNS.`, `WINS.` (las cuatro EN ya están en uso).

### 5.3 Navbar y menú (sitewide, `css/home.css` + `blog/blog.css`)
- `.nav-cta` con `white-space: nowrap` y `flex-shrink: 0`: el botón ya no se parte.
- **769–979 px → hamburguesa.** El navbar de escritorio necesita ~980 px para logo + 5 enlaces + EN + CTA.
- **980–1259 px:** ritmo apretado (padding 28px, gap 20px, CTA compacto). **980–1100 px:** además se ocultan CASOS y BLOG.
- **El logo nunca se comprime** (`#navbar > a:first-child { flex-shrink: 0 }`). Antes bajaba a 35 px de ancho a 1024 px.
- **Menú desplegable** arranca debajo del navbar (`padding-top: calc(var(--nh) + 8px)`, `justify-content: safe center`), tipografía sensible a la altura `clamp(30px, min(7.4vw, 4.4vh), 56px)`.
- **Botón EN del navbar:** se oculta con el menú abierto (el menú trae su propio `#mnav-lang`). En hamburguesa va pegado a la hamburguesa (`margin-left: auto`). Estilo contorno 1px `rgba(255,255,255,.22)` sobre transparente, hover lime. `.active-en` conserva la placa lime.

### 5.4 Barrido responsive de todo el sitio (39 páginas × 9 anchos, 1440→360)
- Sin desborde horizontal ni texto recortado.
- **Flecha huérfana:** la `→` final quedaba sola en su renglón en 17 controles. Ahora va pegada con `&nbsp;` (HTML y claves `h:`) / `\u00a0` (claves `t:` de los diccionarios JS) en todo el sitio. **Al escribir copy nuevo con flecha final, usa `&nbsp;→`.**
- **`/en/case-studies/`:** faltaba `aspect-ratio:16/10; align-self:center` en `.csx-card-shot` (tenía `min-height:300px`). Ya coincide con ES.
- **Aviso de cookies:** `components/cookie-consent.js` ahora lee `<html lang>` primero.
- **No se tocó a propósito:** ~425 elementos de prosa con último renglón corto a 320-360 px. Es acomodo normal de texto, no defecto.

### 5.5 Otros entregables de la sesión (ya en producción)
- Plan de mejora de ventas completo (`_dev/PLAN-MEJORA-VENTAS-2026-09-06.md`).
- Tipografía viva del hero, numerales fantasma por sección, campo de líneas (`js/hero-field-worker.js`).
- Simulador de AI Search `/ia/` y `/en/ai/` con Workers AI `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (el 3.1-8b fue retirado). Evento `ia_simulacion` publicado en GTM versión 8.
- Hover con video del portafolio administrable desde el CMS (columna `video` en D1, subida a R2, máx 3 MB, solo desktop con mouse).
- i18n del portafolio como bloque JSON (arreglo de CSP). `home.js` **no debe** tener claves `port-c*`/`port-d*`.
- Landing `/ventas/` y `/en/sales/` del "Sistema de clientes": **`noindex`, sin enlazar**, esperando decisión de precios.

### 5.6 Regeneración del caché del portafolio
El badge "Ver Proyecto&nbsp;→" requirió regenerar `site_cache`. **Ya está hecho** (verificado 11 sep).

---

## 6. Método de verificación que funcionó

- **Mide en muchos anchos, no solo 1440 y 390.** El bug del logo (1101-1250 px) y el del CTA (769-979 px) llevaban meses sin detectarse por medir solo en los extremos.
- **Verifica en producción, no solo en local.** El badge del portafolio pasó la verificación local y falló en producción (§3.1).
- **Cuenta renglones con los rectángulos del texto** (`Range.getClientRects()`), no dividiendo altura entre interlineado: los `min-height: 44px` de área de toque dan falsos positivos.
- **`object-fit: cover` es recorte, no deformación.** Compara proporciones solo como pista.
- **En Python, `.` no cruza saltos de línea.** Una regex con `.{95}` para extraer contexto devolvió "cero hallazgos" sobre HTML multilínea cuando sí había.
- Playwright: `/usr/bin/python3` con Chrome for Testing en
  `~/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`.
  `page.route()` cuelga la carga de videos; el headless shell no decodifica VP9.
- Servidor local: `python3 -m http.server 8097` desde la raíz del repo (no ejecuta Functions: el SSR del portafolio no se ve en local).

---

## 7. Pendientes

### Ojo: líneas desactualizadas en `_dev/PENDIENTES-VENTAS-2026-09-09.md`
- **Líneas 12-13** (precios de `/ventas/`: $8,900 + $1,900/mes y $19,900 + $3,500/mes): son una **propuesta de un agente, no aprobada**, y se hizo sin revisar lo que Carlos ya cobra. No las trates como decididas ni las publiques.
- **Línea 32** menciona mantenimiento de $3,500 y $800: **obsoleto**. Vigente: $1,000 / $1,500 (§4).

### Bloquean trabajo (decide Carlos)
- [ ] Precios del Sistema de clientes → luego quitar `noindex` de `/ventas/` y `/en/sales/` y enlazar (navbar, footer, sitemap, llms.txt).
- [ ] Creativo de la campaña Meta a `/ia/` ($150 MXN/día, creada **en pausa**, cuenta `445058470900401`).
- [ ] Tiempo de entrega de una tienda Tiendanube (hoy: "se confirma en tu propuesta").
- [ ] Fuentes verificables del 93 % (ficha SEO) y 78 % (ficha de tiendas), o retirarlas.
- [ ] Garantías con número y letra chica (rondas de ajustes, esquema de pago, renovación de dominio/hosting año 2).

### Insumos de prueba social
- [ ] Testimonio de Sergio Luque · testimonio del Dr. César Salas · reseñas en Google Business (IMVEC, Mainoflex, Seminuevos Coapa).

### Listo para ejecutar
- [ ] Grabar los 3 loops de hover (IMVEC, Mainoflex, Seminuevos Coapa) y subirlos desde el admin. Specs en `images/portafolio/video/LEEME.md`.
- [ ] Marcar `ia_simulacion` como evento clave en GA4 cuando tenga datos.

---

## 8. Commits de la sesión (más recientes primero)

| Commit | Qué |
|---|---|
| `23a8829` | Badge del portafolio con flecha pegada (SSR) |
| `8079417` | Barrido responsive: flecha huérfana, retícula EN, cookies en idioma de la página |
| `d384b65` | Botón EN con contorno y junto a la hamburguesa; logo que ya no se comprime |
| `36d68a8` | Menú debajo del navbar, EN oculto con menú abierto, tipografía por altura |
| `3e101b2` | CTA del navbar que se partía; hamburguesa en 769-979 px; `text-wrap: balance` |
| `49f9f78` | Hero: subtítulo nuevo, fuera `#heroProof`, palabras del embudo, ceja legible |
| `0bb8720` | Mantenimiento en dos niveles ($1,000 / $1,500) |
| `d2fe335` | Búsqueda con IA visible en los planes |
| `f320bda` | Fuera "premium", precio tachado y cejas de sección |
| `add6294`, `51cd879` | i18n del portafolio como bloque JSON (CSP) |
| `63f3110` | Video de hover administrable desde el CMS |
| `6acaf37` | Simulador IA con llama-3.3-70b |
| `83499bf` | Landing `/ventas/` (noindex) |
| `6c7bc34` | Tipografía viva + simulador de AI Search |
| `d912885` | Plan de mejora de ventas |
