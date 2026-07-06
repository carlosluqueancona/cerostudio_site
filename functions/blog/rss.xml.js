/**
 * Cloudflare Pages Function: /blog/rss.xml
 * Feed RSS 2.0 dinámico — lee los posts publicados de D1 en CADA request, así
 * que siempre refleja el estado actual del blog: publicar, editar o despublicar
 * un post se ve en el feed sin pasos extra. Mismo patrón que sitemap.xml.js.
 * La ruta con nombre exacto (/blog/rss.xml) gana sobre [slug].js en Pages.
 */

const BASE = 'https://cerostudio.ai';
const FEED_TITLE = 'Cero Studio — Blog';
const FEED_DESC  = 'Consejos sobre diseño web, marketing digital y SEO para emprendedores y negocios en México.';
const MAX_ITEMS  = 50; // ponytail: cap del feed; subir si se necesita histórico completo

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Envuelve en CDATA cerrando cualquier ']]>' interno de forma segura.
function cdata(s) {
  return `<![CDATA[${String(s ?? '').replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`;
}

// href/src="/algo" → absoluto. No toca "//" (protocol-relative) ni "http(s)://".
function absolutize(html) {
  return String(html ?? '').replace(/(href|src)="\/(?!\/)/g, `$1="${BASE}/`);
}

// URL desnuda: "/algo" → "https://cerostudio.ai/algo". Deja intactas las absolutas
// y las protocol-relative. Para featured_image (no es HTML, es una URL suelta).
function absUrl(u) {
  u = String(u ?? '');
  return /^\/(?!\/)/.test(u) ? BASE + u : u;
}

// "YYYY-MM-DD HH:MM:SS" (SQLite) o ISO → RFC-822 ("Fri, 26 Jun 2026 12:00:00 GMT").
function toRFC822(s) {
  if (!s) return null;
  const iso = String(s).includes('T') ? s : String(s).replace(' ', 'T') + 'Z';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toUTCString();
}

function stripTags(html) {
  return String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function onRequestGet({ env }) {
  // Best-effort: si D1 no está (dev local, outage), servimos un feed válido vacío.
  let results = [];
  try {
    if (env?.DB?.prepare) {
      const r = await env.DB.prepare(
        `SELECT title, slug, category, featured_image, featured_image_alt,
                excerpt, content, published_at
         FROM posts WHERE (status = 'published' OR (status = 'scheduled' AND datetime(published_at) <= datetime('now')))
         ORDER BY published_at DESC LIMIT ${MAX_ITEMS}`
      ).all();
      results = r?.results || [];
    }
  } catch {
    results = [];
  }

  const lastBuild = toRFC822(results[0]?.published_at) || new Date().toUTCString();
  const feedUrl = `${BASE}/blog/rss.xml`;

  const items = results.map(p => {
    const link = `${BASE}/blog/${p.slug}`;
    const pub  = toRFC822(p.published_at);
    const desc = (p.excerpt && p.excerpt.trim()) || stripTags(p.content).slice(0, 280);
    const hero = p.featured_image
      ? `<p><img src="${esc(absUrl(p.featured_image))}" alt="${esc(p.featured_image_alt || p.title)}" /></p>`
      : '';
    const full = hero + absolutize(p.content);
    return [
      '    <item>',
      `      <title>${esc(p.title)}</title>`,
      `      <link>${link}</link>`,
      `      <guid isPermaLink="true">${link}</guid>`,
      pub ? `      <pubDate>${pub}</pubDate>` : '',
      p.category ? `      <category>${esc(p.category)}</category>` : '',
      `      <description>${cdata(desc)}</description>`,
      `      <content:encoded>${cdata(full)}</content:encoded>`,
      '    </item>',
    ].filter(Boolean).join('\n');
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(FEED_TITLE)}</title>
    <link>${BASE}/blog/</link>
    <description>${esc(FEED_DESC)}</description>
    <language>es-MX</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
