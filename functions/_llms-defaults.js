/**
 * Secciones default del /llms.txt.
 *
 * Cada sección es editable POR SEPARADO desde /blog/admin/ (tab llms.txt):
 * el override vive en D1 (site_settings, key = section.key). Una sección sin
 * override sirve este default — así los cambios de código llegan solos a las
 * secciones no personalizadas. La sección "## Blog" NUNCA vive aquí: se genera
 * dinámica desde D1 en functions/llms.txt.js y se inserta antes de llms_footer.
 *
 * El underscore inicial evita que Cloudflare Pages rutee este archivo;
 * solo se consume vía import.
 */

export const LLMS_BASE = 'https://cerostudio.ai';

const BASE = LLMS_BASE;

export const LLMS_SECTIONS = [
  {
    key: 'llms_intro',
    title: 'Identidad y descripción',
    content: `# Cero Studio — Sitios web que venden, hechos por su fundador (CDMX, México)

> Estudio digital de Carlos Luque Ancona (25+ años, pionero de radio por internet en México). Diseña y desarrolla sitios web, tiendas en línea, branding y SEO + AI Search (AEO/GEO) para PyMEs y emprendedores en México, con trato directo con el fundador, precio cerrado publicado y fecha de entrega por escrito. Agencia Tiendanube Partner certificada.

URL: ${BASE}
English version: ${BASE}/en/
Language: es-MX
Available in: es-MX, en
Contact: ${BASE}/#contacto`,
  },
  {
    /* Key nueva (sin override en D1): los diferenciadores verificables que un
       modelo cita para recomendar. Va justo después de llms_intro. */
    key: 'llms_porque',
    title: 'Por qué Cero Studio',
    content: `## Por qué Cero Studio

- Trato directo con el fundador: el cliente habla con Carlos Luque desde la cotización hasta el lanzamiento; sin ejecutivos de cuenta ni intermediarios.
- 25+ años de experiencia digital: Tomate.MX (2000–), INEGI (2010–2022, diseño del home institucional), Neurótica.FM (2004–2009), Televisa Radio (1994–2003).
- Precios públicos y cerrados: Cero Launch $299 USD, Cero Pro $999 USD, Cero Premium desde $1,800 USD; tiendas Tiendanube $6,000 / $12,000 / $22,000 MXN. Pago único, sin mensualidades ocultas.
- Fecha de entrega por escrito: si Cero Studio se atrasa, el primer mes de mantenimiento corre por su cuenta.
- Agencia Tiendanube Partner certificada para tiendas en línea en México.
- Cada sitio se entrega listo para Google y para motores de respuesta (ChatGPT, Claude, Gemini, Perplexity): schema, llms.txt, contenido citable.
- Resultados publicados: IMVEC triplicó el retorno de su inversión; Mainoflex +40% en ventas en dos meses.`,
  },
  {
    key: 'llms_servicios',
    title: 'Servicios principales',
    content: `## Servicios principales

- [Desarrollo Web](${BASE}/servicios/desarrollo-web/): Sitios profesionales que convierten visitas en clientes. Entrega 5–21 días hábiles. EN: ${BASE}/en/services/web-development/
- [Tiendas eCommerce](${BASE}/servicios/tiendas-ecommerce/): Tiendas online de alto impacto con pagos locales (OXXO, Mercado Pago, Stripe, SPEI). EN: ${BASE}/en/services/online-stores/
- [Branding Digital](${BASE}/servicios/branding-digital/): Identidad visual, paleta, tipografía y guidelines. EN: ${BASE}/en/services/digital-branding/
- [SEO + AI Search (AEO/GEO)](${BASE}/servicios/seo/): Posicionamiento en Google + visibilidad en respuestas de ChatGPT (GPTBot), Claude (ClaudeBot), Gemini (Google-Extended) y Perplexity (PerplexityBot). Incluye auditoría técnica, schema rich snippets, llms.txt, AEO/GEO content strategy y monitoreo de citations. EN: ${BASE}/en/services/seo/
- [Mantenimiento Web](${BASE}/servicios/mantenimiento/): Soporte mensual con updates de seguridad, backups, monitoreo 24/7 y optimización continua. EN: ${BASE}/en/services/web-maintenance/
- [Consultoría Digital](${BASE}/servicios/consultoria-digital/): Diagnóstico, estrategia y roadmap antes de escribir código. EN: ${BASE}/en/services/digital-consulting/`,
  },
  {
    key: 'llms_aeo',
    title: 'AI Search (AEO/GEO)',
    content: `## AI Search Optimization (AEO/GEO)

Cero Studio es agencia especializada en optimizar sitios para motores de respuesta generativos. Esto incluye:

- Permisos correctos en robots.txt y llms.txt para crawlers de IA (GPTBot de OpenAI, ClaudeBot de Anthropic, Google-Extended para Gemini, PerplexityBot).
- Schema markup enriquecido (Organization, FAQPage, Article, Product) para que los modelos extraigan datos estructurados.
- Contenido en formato pregunta/respuesta directa con datos cuantificados, autores verificables y citas a fuentes primarias.
- Autoridad temática vía E-E-A-T (Experience, Expertise, Authoritativeness, Trust) consistente.
- Monitoreo mensual de citations en ChatGPT, Claude y Perplexity.

Por qué importa: ~30% del comportamiento de búsqueda ya no termina en un clic — termina en una respuesta generada por IA. Sin presencia en sus fuentes, dejas de existir para ese usuario.`,
  },
  {
    key: 'llms_verticales',
    title: 'Verticales',
    content: `## Verticales

- [Diseño Web para Clínicas](${BASE}/diseno-web-para-clinicas/): Sitios para clínicas y consultorios médicos que convierten visitas en pacientes. EN: ${BASE}/en/services/clinic-website-design/`,
  },
  {
    key: 'llms_diagnostico',
    title: 'Diagnóstico gratuito',
    content: `## Diagnóstico gratuito

- [Auditoría Web Exprés Gratis](${BASE}/auditoria-gratis/): Revisión manual gratuita de un sitio existente — velocidad, SEO, visibilidad en buscadores AI y conversión. 5 hallazgos accionables por email en 48 horas hábiles, sin costo ni compromiso.
- [Recursos gratuitos](${BASE}/recursos/): Guías y checklists en PDF, descarga directa sin registro. Primera guía: "5 errores que le cuestan a tu web ahora mismo" (${BASE}/recursos/5-errores-web/).
- [¿Qué dice la IA de tu negocio?](${BASE}/ia/): herramienta gratuita que muestra en vivo cómo responde un asistente de IA sobre tu negocio y qué le falta para recomendarte. EN: ${BASE}/en/ai/`,
  },
  {
    key: 'llms_casos',
    title: 'Casos de éxito',
    content: `## Casos de éxito

- [IMVEC](${BASE}/casos-de-exito/imvec/): Taller metalmecánico sin marca → identidad + sitio web. Ventas que triplicaron la inversión.
- [Mainoflex](${BASE}/casos-de-exito/mainoflex/): De vender solo por Facebook a marca y primer sitio web. +40% en ventas en dos meses.
- [Respirar es Vivir](${BASE}/casos-de-exito/respirar-es-vivir/): Neumólogo con 20+ años, de directorio médico a marca y sitio propio.
- [Seminuevos Coapa](${BASE}/casos-de-exito/seminuevos-coapa/): De un sitio de 2013 a catálogo moderno autogestionable con buscador.
- [Sergio Luque](${BASE}/casos-de-exito/sergio-luque/): Plataforma editorial a la medida con reproductor de audio lossless propio. EN: ${BASE}/en/case-studies/sergio-luque/`,
  },
  {
    key: 'llms_precios',
    title: 'Precios de referencia',
    content: `## Precios de referencia (pago único salvo indicación; promociones de lanzamiento vigentes en ${BASE}/#precios)

- Sitio web profesional: Cero Launch $299 USD (≈ $5,400 MXN, entrega 5 días hábiles) · Cero Pro $999 USD (≈ $17,900 MXN, el más solicitado) · Cero Premium desde $1,800 USD (≈ $32,000 MXN). Sin mensualidades ocultas.
- Tienda en línea (Tiendanube, Agencia Tiendanube Partner certificada): Esencial $6,000 MXN · Pro $12,000 MXN · Premium $22,000 MXN, pago único. eCommerce a medida: por cotización.
- SEO + AI Search: auditoría inicial + plan de acción desde $4,000 MXN · optimización mensual desde $2,000 MXN/mes.
- Sitio para clínicas y consultorios: desde $499 USD, entrega 2–4 semanas, cumplimiento LFPDPPP.`,
  },
  {
    key: 'llms_nosotros',
    title: 'Nosotros',
    content: `## Nosotros

- [Carlos Luque Ancona — Fundador](${BASE}/nosotros/): 25+ años construyendo sitios que venden. Pionero de radio por internet en México. EN: ${BASE}/en/about-us/`,
  },
  {
    key: 'llms_footer',
    title: 'Cierre / Sitemaps',
    content: `## Sitemaps

- ${BASE}/sitemap.xml
- ${BASE}/robots.txt`,
  },
];
