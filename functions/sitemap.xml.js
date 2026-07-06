/**
 * Cloudflare Pages Function: /sitemap.xml
 * Dynamic sitemap — includes static pages + all published blog posts from D1.
 */

const BASE = 'https://cerostudio.ai';

// Only indexable URLs belong in the sitemap.
// /brief/, /proyecto/, /portal_cliente/ y /privacidad/ son noindex y se omiten.
const STATIC_PAGES = [
  { loc: '/',                                     priority: '1.0', changefreq: 'weekly'  },
  { loc: '/nosotros/',                            priority: '0.8', changefreq: 'monthly' },
  { loc: '/en/about-us/',                         priority: '0.7', changefreq: 'monthly' },
  { loc: '/casos-de-exito/',                      priority: '0.8', changefreq: 'monthly' },
  { loc: '/casos-de-exito/sergio-luque/',         priority: '0.8', changefreq: 'monthly' },
  { loc: '/casos-de-exito/imvec/',                priority: '0.8', changefreq: 'monthly' },
  { loc: '/casos-de-exito/mainoflex/',            priority: '0.8', changefreq: 'monthly' },
  { loc: '/casos-de-exito/respirar-es-vivir/',    priority: '0.8', changefreq: 'monthly' },
  { loc: '/casos-de-exito/seminuevos-coapa/',     priority: '0.8', changefreq: 'monthly' },
  { loc: '/en/',                                  priority: '0.9', changefreq: 'weekly'  },
  { loc: '/en/case-studies/',                     priority: '0.7', changefreq: 'monthly' },
  { loc: '/en/case-studies/sergio-luque/',        priority: '0.7', changefreq: 'monthly' },
  { loc: '/en/case-studies/imvec/',               priority: '0.7', changefreq: 'monthly' },
  { loc: '/en/case-studies/mainoflex/',           priority: '0.7', changefreq: 'monthly' },
  { loc: '/en/case-studies/respirar-es-vivir/',   priority: '0.7', changefreq: 'monthly' },
  { loc: '/en/case-studies/seminuevos-coapa/',    priority: '0.7', changefreq: 'monthly' },
  { loc: '/blog/',                                priority: '0.9', changefreq: 'daily'   },
  { loc: '/servicios/desarrollo-web/',            priority: '0.8', changefreq: 'monthly' },
  { loc: '/servicios/tiendas-ecommerce/',         priority: '0.8', changefreq: 'monthly' },
  { loc: '/servicios/branding-digital/',          priority: '0.8', changefreq: 'monthly' },
  { loc: '/servicios/seo/',                       priority: '0.8', changefreq: 'monthly' },
  { loc: '/servicios/mantenimiento/',             priority: '0.8', changefreq: 'monthly' },
  { loc: '/servicios/consultoria-digital/',       priority: '0.8', changefreq: 'monthly' },
  { loc: '/diseno-web-para-clinicas/',            priority: '0.8', changefreq: 'monthly' },
  { loc: '/auditoria-gratis/',                    priority: '0.8', changefreq: 'monthly' },
  { loc: '/en/services/web-development/',         priority: '0.7', changefreq: 'monthly' },
  { loc: '/en/services/online-stores/',           priority: '0.7', changefreq: 'monthly' },
  { loc: '/en/services/digital-branding/',        priority: '0.7', changefreq: 'monthly' },
  { loc: '/en/services/seo/',                     priority: '0.7', changefreq: 'monthly' },
  { loc: '/en/services/web-maintenance/',         priority: '0.7', changefreq: 'monthly' },
  { loc: '/en/services/digital-consulting/',      priority: '0.7', changefreq: 'monthly' },
  { loc: '/en/services/clinic-website-design/',   priority: '0.7', changefreq: 'monthly' },
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
  const today = new Date().toISOString().slice(0, 10);

  // Best-effort fetch of published posts. If D1 is unavailable (local dev,
  // outage, etc.) we still serve a valid sitemap with the static pages.
  let results = [];
  try {
    if (env?.DB?.prepare) {
      const r = await env.DB.prepare(
        "SELECT slug, published_at FROM posts WHERE (status = 'published' OR (status = 'scheduled' AND datetime(published_at) <= datetime('now'))) ORDER BY published_at DESC"
      ).all();
      results = r?.results || [];
    }
  } catch {
    results = [];
  }

  const latestPostDate = results[0]?.published_at?.slice(0, 10) || today;

  const staticEntries = STATIC_PAGES.map(p =>
    urlEntry({ ...p, lastmod: p.loc === '/blog/' ? latestPostDate : today })
  ).join('\n');

  const postEntries = results.map(p => urlEntry({
    loc:        `/blog/${p.slug}`,
    lastmod:    p.published_at ? p.published_at.slice(0, 10) : undefined,
    priority:   '0.8',
    changefreq: 'monthly',
  })).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${postEntries ? '\n' + postEntries : ''}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
