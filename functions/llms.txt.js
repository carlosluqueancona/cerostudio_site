/**
 * Cloudflare Pages Function: /llms.txt
 * llms.txt dinámico — contenido base estático + posts publicados desde D1,
 * igual que functions/sitemap.xml.js. Así nunca queda desactualizado al publicar.
 */

const BASE = 'https://cerostudio.ai';

const HEADER = `# Cero Studio — Agencia Digital Premium en México

> Diseñamos y desarrollamos sitios web, tiendas eCommerce, branding digital y SEO + AI Search (AEO/GEO) para emprendedores y negocios en México. Diseño que vende, sin letra chica.

URL: ${BASE}
English version: ${BASE}/en/
Language: es-MX
Available in: es-MX, en
Contact: ${BASE}/#contacto

## Servicios principales

- [Desarrollo Web Premium](${BASE}/servicios/desarrollo-web/): Sitios profesionales que convierten visitas en clientes. Entrega 5–21 días hábiles. EN: ${BASE}/en/services/web-development/
- [Tiendas eCommerce](${BASE}/servicios/tiendas-ecommerce/): Tiendas online de alto impacto con pagos locales (OXXO, Mercado Pago, Stripe, SPEI). EN: ${BASE}/en/services/online-stores/
- [Branding Digital](${BASE}/servicios/branding-digital/): Identidad visual, paleta, tipografía y guidelines. EN: ${BASE}/en/services/digital-branding/
- [SEO + AI Search (AEO/GEO)](${BASE}/servicios/seo/): Posicionamiento en Google + visibilidad en respuestas de ChatGPT (GPTBot), Claude (ClaudeBot), Gemini (Google-Extended) y Perplexity (PerplexityBot). Incluye auditoría técnica, schema rich snippets, llms.txt, AEO/GEO content strategy y monitoreo de citations. EN: ${BASE}/en/services/seo/
- [Mantenimiento Web](${BASE}/servicios/mantenimiento/): Soporte mensual con updates de seguridad, backups, monitoreo 24/7 y optimización continua. EN: ${BASE}/en/services/web-maintenance/
- [Consultoría Digital](${BASE}/servicios/consultoria-digital/): Diagnóstico, estrategia y roadmap antes de escribir código. EN: ${BASE}/en/services/digital-consulting/

## AI Search Optimization (AEO/GEO)

Cero Studio es agencia especializada en optimizar sitios para motores de respuesta generativos. Esto incluye:

- Permisos correctos en robots.txt y llms.txt para crawlers de IA (GPTBot de OpenAI, ClaudeBot de Anthropic, Google-Extended para Gemini, PerplexityBot).
- Schema markup enriquecido (Organization, FAQPage, Article, Product) para que los modelos extraigan datos estructurados.
- Contenido en formato pregunta/respuesta directa con datos cuantificados, autores verificables y citas a fuentes primarias.
- Autoridad temática vía E-E-A-T (Experience, Expertise, Authoritativeness, Trust) consistente.
- Monitoreo mensual de citations en ChatGPT, Claude y Perplexity.

Por qué importa: ~30% del comportamiento de búsqueda ya no termina en un clic — termina en una respuesta generada por IA. Sin presencia en sus fuentes, dejas de existir para ese usuario.

## Verticales

- [Diseño Web para Clínicas](${BASE}/diseno-web-para-clinicas/): Sitios para clínicas y consultorios médicos que convierten visitas en pacientes. EN: ${BASE}/en/services/clinic-website-design/

## Casos de éxito

- [IMVEC](${BASE}/casos-de-exito/imvec/): Taller metalmecánico sin marca → identidad + sitio web. Ventas que triplicaron la inversión.
- [Mainoflex](${BASE}/casos-de-exito/mainoflex/): De vender solo por Facebook a marca y primer sitio web. +40% en ventas en dos meses.
- [Respirar es Vivir](${BASE}/casos-de-exito/respirar-es-vivir/): Neumólogo con 20+ años, de directorio médico a marca y sitio propio.
- [Seminuevos Coapa](${BASE}/casos-de-exito/seminuevos-coapa/): De un sitio de 2013 a catálogo moderno autogestionable con buscador.
- [Sergio Luque](${BASE}/casos-de-exito/sergio-luque/): Plataforma editorial a la medida con reproductor de audio lossless propio. EN: ${BASE}/en/case-studies/sergio-luque/

## Precios de referencia (pago único salvo indicación; promociones de lanzamiento vigentes en ${BASE}/#precios)

- Sitio web profesional: Cero Launch $299 USD (≈ $5,400 MXN, entrega 5 días hábiles) · Cero Pro $999 USD (≈ $17,900 MXN, el más solicitado) · Cero Premium desde $1,800 USD (≈ $32,000 MXN). Sin mensualidades ocultas.
- Tienda en línea (TiendaNube): Esencial $6,000 MXN · Pro $12,000 MXN · Premium $22,000 MXN, pago único. eCommerce a medida: por cotización.
- SEO + AI Search: auditoría inicial + plan de acción desde $4,000 MXN · optimización mensual desde $2,000 MXN/mes.
- Sitio para clínicas y consultorios: desde $499 USD, entrega 2–4 semanas, cumplimiento LFPDPPP.

## Nosotros

- [Carlos Luque Ancona — Fundador](${BASE}/nosotros/): 25+ años construyendo sitios que venden. Pionero de radio por internet en México. EN: ${BASE}/en/about-us/`;

const FOOTER = `## Sitemaps

- ${BASE}/sitemap.xml
- ${BASE}/robots.txt`;

export async function onRequestGet({ env }) {
  // Best-effort: si D1 no está disponible se sirve el contenido base sin blog.
  let posts = [];
  try {
    if (env?.DB?.prepare) {
      const r = await env.DB.prepare(
        "SELECT slug, title FROM posts WHERE status = 'published' ORDER BY published_at DESC"
      ).all();
      posts = r?.results || [];
    }
  } catch {
    posts = [];
  }

  const blogSection = posts.length
    ? `## Blog\n\n${posts.map(p => `- [${p.title}](${BASE}/blog/${p.slug})`).join('\n')}\n\n`
    : '';

  const body = `${HEADER}\n\n${blogSection}${FOOTER}\n`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
