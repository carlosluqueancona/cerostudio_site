# Handoff · implementación del plan de mejora (para continuar con Opus)
**Fecha:** 7 sep 2026 · **Sesión origen:** Fable 5.1 (se agota el uso). **Objetivo:** terminar de aplicar `_dev/PLAN-MEJORA-VENTAS-2026-09-06.md` sin preguntar, SIN commit ni push (Carlos da el OK tras revisar en preview).

## 1. Estado al momento del handoff
- Plan completo: `_dev/PLAN-MEJORA-VENTAS-2026-09-06.md` (secciones 2 = decisiones ya tomadas D1–D14, 3 = workstreams con archivos disjuntos, 5 = no tocar, 6 = verificación). Detalle de hallazgos: `_dev/auditoria-ventas-2026-09-06-hallazgos.md` (buscar `## ID`).
- Workflow de implementación en curso (run `wf_0553c23f-a3e`, script `~/.claude/projects/-Users-carlos-Code-cerostudio-site/b9667481-5d7e-496c-a69d-17494fb8d1d3/workflows/scripts/cerostudio-implement-plan-wf_0553c23f-a3e.js`). Se puede reanudar con `Workflow({scriptPath, resumeFromRunId:'wf_0553c23f-a3e'})`: los agentes ya terminados regresan de caché.
  - **Terminados (caché):** D EMBUDO (auditoría, recursos, blog, llms, contact.js) · C1 CASOS+NOSOTROS ES.
  - **Reanudados en el 2.º intento (pueden estar completos o parciales):** A1 home-copy · E chrome · B1 fichas ES · luego A2 home-js · B2 fichas EN · C2 casos EN · A3 home-css (último; sube `?v=`).
  - El árbol de trabajo YA tiene cambios en ~51 archivos (`git diff --stat`). Nada está commiteado. **No hacer `git checkout`/`stash`/`reset`.**
- Límite de uso: cada ventana permite ≈1.5–2 M tokens de subagentes; el workflow murió dos veces por eso. Si vuelve a morir: reanudar con el mismo `resumeFromRunId` (el script ya tiene guardas `null` e instrucciones de "continúa desde `git diff`").

## 2. Qué hacer al retomar (en orden)
1. `git diff --stat` y, por workstream, comprobar contra la sección 3 del plan qué falta. Señales rápidas:
   - HOME: `grep -c "heroProof\|stakes-cta-audit\|plan-saving\|form-done\|port-more\|faq-q7" index.html en/index.html js/home.js` (deben existir en los 3) · `grep -n "?v=" index.html en/index.html | grep home` (misma versión en ambos) · `node --check js/home.js`.
   - CHROME: `grep -c "mob-bar\|mnav-cta\|fnav-rec" components/footer.html components/footer-en.html components/navbar.html components/navbar-en.html components/loader.js css/base.css`.
   - FICHAS: `grep -l "sv-proof" servicios/*/index.html en/services/*/index.html diseno-web-para-clinicas/index.html` (13 archivos) · `grep -rn 'href="/#' en/` → 0 · sección "05 — Inversión" en `servicios/desarrollo-web/` y `en/services/web-development/`.
   - CASOS: `grep -l "cs-next" casos-de-exito/*/index.html en/case-studies/*/index.html` (10) · no debe quedar "Espacio reservado"/"Reserved for" en sergio-luque (ES/EN) y sí un respaldo en `_archivo/testimonio-placeholder-sergio-luque-2026-09-07/`.
2. Lo que falte: implementarlo con agentes por workstream (mismos prompts del script) o a mano si es poco. Cuidar tokens: grep/sed por rangos, nunca leer archivos completos.
3. Verificación (sección 6 del plan): servidor `python3 -m http.server 8093 --bind 127.0.0.1` en la raíz del repo + `_dev/scripts/shots_all.sh <dir_salida>` (Playwright del python3 del sistema, headless shell 1234, bloquea GTM/Metricool). Comparar con `_dev/capturas-base-2026-09-06/`. Pruebas funcionales: form del home → panel `.form-done`; `/?servicio=seo#contacto`; `/?ref=imvec&servicio=branding#contacto`; EN con teléfono +1 de 11 dígitos; clic en plan → WhatsApp con plan; barra móvil tras 480 px; menú móvil con CTA; `port-more`; `plan-more`; FAQ 7.
4. Chequeos de reglas: `grep -n "opacity: *0" css/home.css | grep -i hero-static-title` → nada · `grep -l 'id="loader"' **/index.html` → solo `index.html` y `en/index.html` · JSON-LD FAQPage = texto visible (ES y EN) · /en/ sin "≈ $" MXN en planes web · sello Tiendanube sin cambios (`git diff images/` vacío).
5. Reporte a Carlos en ES-MX: qué cambió por workstream, decisiones D1–D14 aplicadas, pendientes de su insumo (sección 4 del plan), y pedir OK para commit + push (Cloudflare Pages despliega main en ~1–2 min; verificar con `?cb=`).

## 3. Reglas que no se negocian
Triple espejo del home (index.html + en/index.html + dicts ES/EN de js/home.js) y bump `?v=` · jamás `opacity:0` en `.hero-static-title` · `#loader` solo en el home; `loader.js` obligatorio en internas · /en/ solo USD en proyectos · no recalcular TC ni cambiar precios · no inventar métricas/testimonios/fuentes · archivar en `_archivo/` en vez de borrar · nada inline en HTML (CSP) · no push sin OK.

## 4. ACTUALIZACIÓN 7 sep (tarde) — implementación TERMINADA, pendiente de OK para push
- Los 9 agentes completaron (A1/A2/A3, B1/B2, C1/C2, D, E). Chequeos de la sección 2 en verde: node --check en 11 .js; 0 `href="/#` en /en/; sv-proof en 14 fichas; cs-next en 10 casos; placeholder de Sergio Luque retirado (respaldo en `_archivo/`); 0 `plan-price-mxn` en /en/; `#loader` solo en home; sin opacity:0 en el H1.
- Correcciones manuales posteriores: bump `home.css?v=20260907c` en las 33 páginas y `home.js?v=20260907b`; `.nos-img-wrap` añadido a SELECTORS de reveal-cards.js; el grid de precios en tablet quedó en `@media (min-width:769px) and (max-width:1100px)` (antes desbordaba en móvil por especificidad de `:has`); `.precios-top` apilado en bloque propio ≤1100; el clamp de bullets solo con ≥2 sobrantes.
- Capturas "después" revisadas: home móvil 23,325 px (antes 25,699; el portafolio colapsa a 5 + CTA y precios compactos; el sub del hero ahora es más largo). Capturas base en `_dev/capturas-base-2026-09-06/`.
- Falta: revisión de Carlos en preview local (`python3 -m http.server 8093`), pruebas funcionales del punto 3 de la sección 2, y OK para commit + push. Desfases menores anotados por los agentes: precio de /diseno-web-para-clinicas/ sigue "Desde $499" (fuera del plan); FAQ SEO EN conserva ≈USD porque la ES los tiene; catálogo EN sin filas AUD-00/REC-01 (no existe /en/free-audit/).
