# Plantilla · Reporte de Auditoría Web Exprés (lead magnet)

> Uso interno. Cuando llegue una solicitud desde /auditoria-gratis/ (email etiquetado
> "Auditoría exprés GRATIS (lead magnet)"), responde con este formato en máximo
> 48 horas hábiles. Meta operativa: 30–40 min por auditoría, no más.
>
> Reglas: 5 hallazgos exactos (ni 3 ni 8). Cero tecnicismos sin traducir. Cada
> hallazgo dice QUÉ pasa, QUÉ le cuesta al negocio y QUÉ hacer. El hallazgo #5
> siempre es el puente natural hacia un servicio de Cero Studio, sin vender duro.

---

**Asunto:** Tu auditoría exprés de [SITIO] — 5 hallazgos ✅

Hola [NOMBRE],

Revisé [SITIO] como lo haría un cliente tuyo: entré desde el celular, busqué qué
vendes, cuánto cuesta y cómo contactarte. Aquí están los 5 hallazgos más
importantes, en orden de impacto:

---

**1. [TITULAR DEL HALLAZGO — ej. "Tu sitio tarda X segundos en cargar en celular"]**
Qué encontré: [1–2 frases, dato concreto: segundos de carga, peso, error visible]
Qué te cuesta: [consecuencia de negocio: "la mitad de tus visitantes se va antes de ver nada"]
Qué hacer: [acción concreta y honesta — si la puede hacer él solo, dilo]

**2. [VELOCIDAD / SEO / VISIBILIDAD AI / CONVERSIÓN — el que aplique]**
Qué encontré: …
Qué te cuesta: …
Qué hacer: …

**3.** …

**4.** …

**5. [SIEMPRE el hallazgo puente — ej. conversión o visibilidad AI]**
Qué encontré: …
Qué te cuesta: …
Qué hacer: [aquí sí puede ser "esto es exactamente lo que resolvemos con X"]

---

**Mi lectura general:** [2–3 frases honestas: qué está bien (siempre reconocer algo),
cuál de los 5 es EL urgente, y qué pasaría si solo arregla ese.]

Los 5 hallazgos son tuyos — puedes implementarlos con quien quieras, incluido
tu equipo. Si prefieres que lo hagamos nosotros, dime y te mando una propuesta
con precio y fecha de entrega garantizada por escrito ([enlace a /#precios]).

Y si quieres el análisis profundo (keywords, competencia y plan de acción
completo), esa es la auditoría SEO completa: $4,000 MXN
([enlace a /servicios/seo/]).

Cualquier duda, respóndeme este correo o mándame WhatsApp.

Carlos Luque
Cero Studio · cerostudio.ai
+52 55 3100 7101

---

## Checklist de revisión (30 min, en este orden)

1. **Velocidad (7 min):** PageSpeed Insights móvil (`./scripts/psi.sh` o
   pagespeed.web.dev) — LCP, peso de imágenes, si usa http obsoleto.
2. **SEO básico (8 min):** `site:dominio.com` en Google (¿está indexado?),
   title/meta de la home (¿dice qué vende y dónde?), un H1 real, https,
   versión móvil sin zoom.
3. **Visibilidad AI (7 min):** robots.txt (¿bloquea GPTBot/ClaudeBot?),
   ¿tiene schema (view-source, buscar ld+json)?, preguntar a ChatGPT/Perplexity
   "recomiéndame [giro] en [ciudad]" y ver si aparece.
4. **Conversión (8 min):** en 5 segundos ¿se entiende qué vende?, ¿hay UN
   llamado a la acción visible sin scroll?, ¿el teléfono/WhatsApp es clickeable
   desde celular?, ¿el formulario tiene más de 4 campos?, ¿hay prueba social?

De lo que salga, escoge los 5 con más impacto de negocio. Si el sitio está tan
mal que hay 15 hallazgos, escoge los 5 que él pueda ENTENDER y priorizar — el
resto sale en la auditoría completa.
