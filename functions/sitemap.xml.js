/**
 * Cloudflare Pages Function: /sitemap.xml
 * Dynamic sitemap — includes static pages + all published blog posts from D1.
 */

const BASE = 'https://cerostudio.ai';

const STATIC_PAGES = [
  { loc: '/',        priority: '1.0', changefreq: 'weekly'  },
  { loc: '/blog/',   priority: '0.9', changefreq: 'daily'   },
  { loc: '/brief/',  priority: '0.7', changefreq: 'monthly' },
];

function urlEntry({ loc, lastmod, priority = '0.6', changefreq = 'monthly' }) {
  return [
    '  <url>',
    `    <loc>${BASE}${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : '',
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n');
}

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      "SELECT slug, published_at FROM posts WHERE status = 'published' ORDER BY published_at DESC"
    ).all();

    const staticEntries = STATIC_PAGES.map(urlEntry).join('\n');

    const postEntries = (results || []).map(p => urlEntry({
      loc:        `/blog/${p.slug}`,
      lastmod:    p.published_at ? p.published_at.slice(0, 10) : undefined,
      priority:   '0.8',
      changefreq: 'monthly',
    })).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${postEntries}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    return new Response('Error generating sitemap', { status: 500 });
  }
}
