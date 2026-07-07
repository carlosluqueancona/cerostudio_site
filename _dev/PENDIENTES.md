# Pendientes · cerostudio.ai
**Actualizado:** 6 julio 2026 (tarde) · (documento vivo — se actualiza en cada sesión)

---

## 🔴 Carlos — esta semana

- [ ] **Estrellas en GA4** (30 seg, a partir del 7 jul): Administración → Eventos →
  pestaña "Eventos recientes" → prender la estrella ⭐ a `lead_form_submit`,
  `whatsapp_click` y `agendar_click` (aparecen ~24 h después de los clics de prueba).
  - [ ] Opcional: apagar la estrella a `close_convert_lead` y `qualify_lead` (sugeridos
    de GA4 sin datos — limpian los reportes de conversión).
- [ ] **Probar el form de /auditoria-gratis/** con datos reales y confirmar que llega
  el email etiquetado "Auditoría exprés GRATIS (lead magnet)".
  *(Si ya lo hiciste como parte de la prueba de GTM, palomea esto.)*
- [ ] **Google Business Profile**: completar perfil + pedir reseña por WhatsApp a
  Gustavo (IMVEC), Jesús (Mainoflex) y Ricardo (Seminuevos Coapa).

## 🟠 Carlos — cuando haya tiempo/presupuesto

- [ ] **Pauta Google Ads** de alta intención ("cuánto cuesta página web méxico",
  "diseño web para clínicas") apuntando a las fichas técnicas + remarketing.
- [ ] **TC con vigencia en propuestas**: línea en cotizaciones tipo "precios en USD;
  equivalente MXN a $17.90, vigente 15 días".
- [ ] **Reporte de auditoría exprés**: cuando llegue el primer lead, usar la plantilla
  `_dev/plantilla-auditoria-expres.md` (5 hallazgos, 48 h hábiles, ~30-40 min).

## 🔵 Claude — con OK de Carlos

*(vacío — todo lo implementable quedó cerrado el 6 jul)*

---

## ✅ Cerrado recientemente (referencia rápida)

| Fecha | Qué |
|---|---|
| 6 jul | Blog: posts PROGRAMADOS (estado ⏰ con fecha/hora, aparición automática sin cron, "Publicar ahora") + purge automático del edge al crear/editar/publicar/eliminar (secrets CF_ZONE_ID/CF_PURGE_TOKEN configurados y verificados) |
| 6 jul | Worktrees: los 6 retirados con OK de Carlos — evidencia y SHAs de rescate en `_archivo/worktrees-retirados-2026-07-06/LEEME.md`; commit huérfano anclado con tag `archivo/keen-brahmagupta-mobilenav` |
| 6 jul | CSP sin `unsafe-inline` en script-src sitewide (admin conserva) — ~50 handlers refactorizados a delegación; verificado en prod sin violaciones |
| 6 jul | Navbar tablet: logo 54px blindado + CASOS/BLOG ocultos en 769–1100px |
| 6 jul | LocalBusiness: RESUELTO por decisión técnica — sin dirección física, Google lo penaliza; el schema Organization actual es lo correcto para remoto. Revisitar solo si algún día hay oficina |
| 6 jul | GTM publicado: triggers + tags de `lead_form_submit` (con `form_type`), `whatsapp_click`, `agendar_click` |
| 5 jul | Quick wins CRO: CTA en artículos del blog (SSR+client), promo amarrada a 5 clientes/mes, garantía de fecha (1 mes de mantenimiento) |
| 5 jul | Lead magnet `/auditoria-gratis/` (ficha AUD-00) + franja de resultados reales en #precios + evento dataLayer |
| 5 jul | Admin: tab llms.txt editable **por sección** (default/personalizado, Blog con candado) |
| 5 jul | Gauges 43%/70% con fuentes primarias (Verizon DBIR 2019, BCG 2020) ES/EN |
| 5 jul | Blog pase brutalist + fix menú móvil; fixes /nosotros/ (voseo, Mainoflex 2 meses) |
| 5 jul | Verificado: /nosotros/ ya era SB7 y /api/contact ya tenía rate-limit en 3 capas — no se rehicieron |
| 5 jul | Plantilla del reporte de auditoría exprés (`_dev/plantilla-auditoria-expres.md`) |
| 5 jul | Regla de moneda USD/≈MXN en fichas + metas largas + H1 del blog |
| 5 jul | Migración brutalist sv-* completa (6 landings) + ritmo de cejas en home |

---

*Regla de la casa: nada se borra — todo retiro va a `_archivo/<motivo-fecha>/` con LEEME
para revisión de Carlos. Deploy = push a main solo con OK explícito.*
