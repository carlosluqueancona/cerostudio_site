/**
 * Cloudflare Pages Function: /blog/[slug]
 *
 * Serves /blog/index.html for any blog post URL so the SPA can render content
 * client-side, BUT first injects per-post SEO meta tags + BlogPosting JSON-LD
 * via HTMLRewriter — so Google, social previews and AI search engines see the
 * correct title, description, canonical, OG image and structured data without
 * waiting for client-side hydration.
 *
 * Static files (blog.js, blog.css, admin/) take precedence over this function
 * automatically.
 */

import { requireAuth } from '../api/admin/_shared.js';

const BASE_URL = 'https://cerostudio.ai';
const DEFAULT_OG_IMAGE = `${BASE_URL}/images/CERO_Studio_SocialShare.png`;
const PUBLISHER_LOGO = `${BASE_URL}/images/svg/Cero_Studio_AI_Horizontal.svg`;

function escAttr(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function toIsoDate(d) {
  if (!d) return new Date().toISOString();
  // SQLite default format is "YYYY-MM-DD HH:MM:SS" (no T, no Z)
  const normalized = typeof d === 'string'
    ? (d.includes('T') ? d : d.replace(' ', 'T')) + (/Z$|[+-]\d{2}:?\d{2}$/.test(d) ? '' : 'Z')
    : d;
  const parsed = new Date(normalized);
  return isNaN(parsed) ? new Date().toISOString() : parsed.toISOString();
}

function absoluteUrl(maybeRelative) {
  if (!maybeRelative) return null;
  if (/^https?:\/\//i.test(maybeRelative)) return maybeRelative;
  return BASE_URL + (maybeRelative.startsWith('/') ? '' : '/') + maybeRelative;
}

function formatDateEsMx(d) {
  if (!d) return '';
  const normalized = typeof d === 'string'
    ? (d.includes('T') ? d : d.replace(' ', 'T')) + (/Z$|[+-]\d{2}:?\d{2}$/.test(d) ? '' : 'Z')
    : d;
  const date = new Date(normalized);
  if (isNaN(date)) return '';
  try {
    return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/**
 * Build the full <article> body that mirrors what blog.js renderPost() would
 * produce client-side. post.content is already trusted HTML stored in D1, so
 * it's emitted verbatim. Other fields (title, category, alt, etc.) are
 * escaped because they go into text or attribute positions.
 */
// CTA de conversión — mismo markup que blog/blog.js (client-side)
const ARTICLE_CTA_END = [
  '<aside class="article-cta" data-label="Cero Studio">',
  '  <h2 class="article-cta-title">¿Tu sitio se ve bien <em>pero no vende?</em></h2>',
  '  <p class="article-cta-text">Diseñamos sitios que convierten visitas en clientes. Cuéntanos tu proyecto y recibe una propuesta clara en menos de 24 horas.</p>',
  '  <div class="article-cta-row">',
  '    <a href="/#contacto" class="article-cta-btn">Cotizar mi proyecto →</a>',
  '    <a href="https://wa.me/525531007101?text=Hola%2C%20le%C3%AD%20un%20art%C3%ADculo%20de%20su%20blog%20y%20quiero%20cotizar%20mi%20proyecto." class="article-cta-wa" target="_blank" rel="noopener">WhatsApp directo</a>',
  '  </div>',
  '</aside>',
].join('\n');

const ARTICLE_CTA_MID = '<div class="article-cta-inline"><span>¿Necesitas un sitio que venda?</span> <a href="/#contacto">Cotiza gratis — respuesta en 24 horas →</a></div>';

// Inserta el CTA inline a la mitad del artículo (solo si hay ≥8 párrafos)
function withMidCta(content) {
  const parts = (content || '').split('</p>');
  if (parts.length < 9) return content;
  const mid = Math.ceil((parts.length - 1) / 2);
  return parts.slice(0, mid).join('</p>') + '</p>' + ARTICLE_CTA_MID + parts.slice(mid).join('</p>');
}

function buildArticleHtml(post) {
  const heroImg = post.featured_image
    ? `<div class="article-featured-image"><img src="${escAttr(absoluteUrl(post.featured_image) || post.featured_image)}" alt="${escAttr(post.featured_image_alt || post.title)}"></div>`
    : '';

  return [
    '<a id="main-content" tabindex="-1"></a>',
    '<article class="article-container">',
    '  <a href="/blog/" data-route="/blog/" class="back-link">← Volver al blog</a>',
    '  <header class="article-header">',
    `    <div class="post-card-cat" style="margin-bottom: 24px;">${escAttr(post.category || 'General')}</div>`,
    `    <h1 class="article-title">${escAttr(post.title)}</h1>`,
    '    <div class="article-meta">',
    `      Publicado el ${escAttr(formatDateEsMx(post.published_at || post.created_at))} • Cero Studio`,
    '    </div>',
    '    ' + heroImg,
    '  </header>',
    '  <div class="article-content">',
    '    ' + withMidCta(post.content || ''),
    '  </div>',
    ARTICLE_CTA_END,
    '</article>',
  ].join('\n');
}

export async function onRequest(context) {
  const slug = context.params.slug;

  // Pass through static assets (js, css, images, etc.)
  if (/\.[a-zA-Z0-9]+$/.test(slug)) {
    return context.env.ASSETS.fetch(context.request);
  }

  // Serve admin panel directly (avoid redirect loop)
  if (slug === 'admin') {
    const url = new URL(context.request.url);
    url.pathname = '/blog/admin/index.html';
    const r = await context.env.ASSETS.fetch(url.toString());
    const out = new Response(r.body, r);
    // El admin nunca se cachea: ni edge ni browser (evita panel congelado)
    out.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return out;
  }

  // Modo PREVIEW: ?preview=1 + sesión de admin válida → sirve el post aunque
  // sea borrador o programado (para el botón "Previsualizar" del editor).
  // Sin sesión, el parámetro se ignora y aplica el gating normal.
  const wantsPreview = new URL(context.request.url).searchParams.get('preview') === '1';
  let isPreview = false;
  if (wantsPreview) {
    try { isPreview = await requireAuth(context.request, context.env); } catch { isPreview = false; }
  }

  // Best-effort: look up the post in D1. If D1 is unavailable (local dev
  // without binding) or query fails, fall through and serve the SPA shell —
  // the client-side blog.js will still render content from /api/posts.
  let post = null;
  let dbAvailable = false;
  try {
    if (context.env?.DB?.prepare) {
      const gate = isPreview
        ? ''
        : "AND (status = 'published' OR (status = 'scheduled' AND datetime(published_at) <= datetime('now')))";
      post = await context.env.DB.prepare(
        `SELECT title, slug, category, meta_title, meta_description,
                featured_image, featured_image_alt, excerpt, content,
                published_at, created_at
           FROM posts
          WHERE slug = ? ${gate}
          LIMIT 1`
      ).bind(slug).first();
      dbAvailable = true;
    }
  } catch (_) {
    dbAvailable = false;
  }

  // Fetch the SPA shell
  const shellUrl = new URL(context.request.url);
  shellUrl.pathname = '/blog/index.html';
  const assetResponse = await context.env.ASSETS.fetch(shellUrl.toString());

  // Fetch navbar + footer partials in parallel so we can inline them server-side.
  // Without this, Googlebot sees an orphan page (no nav, no footer, no internal
  // links beyond the article itself) and flags it as Soft 404. Inlining gives
  // crawlers full site context + ~30 internal links per blog post.
  const navbarUrl = new URL(context.request.url);
  navbarUrl.pathname = '/components/navbar.html';
  const footerUrl = new URL(context.request.url);
  footerUrl.pathname = '/components/footer.html';
  const [navbarHtml, footerHtml] = await Promise.all([
    context.env.ASSETS.fetch(navbarUrl.toString())
      .then(r => (r.ok ? r.text() : ''))
      .catch(() => ''),
    context.env.ASSETS.fetch(footerUrl.toString())
      .then(r => (r.ok ? r.text() : ''))
      .catch(() => ''),
  ]);

  // Post not found AND D1 is reachable → return 404 status
  // (body still has the SPA shell so users see a graceful message)
  if (dbAvailable && !post) {
    return new Response(assetResponse.body, {
      status: 404,
      headers: { ...Object.fromEntries(assetResponse.headers), 'X-Cero-SSR': 'not-found' },
    });
  }

  // No post data (D1 unavailable in dev) → return SPA shell as-is
  if (!post) {
    return new Response(assetResponse.body, {
      status: assetResponse.status,
      headers: { ...Object.fromEntries(assetResponse.headers), 'X-Cero-SSR': 'fallback' },
    });
  }

  // ── Build per-post SEO data ──────────────────────────────────────────────
  const fullUrl = `${BASE_URL}/blog/${post.slug}`;
  const title = post.meta_title || `${post.title} | Blog Cero Studio`;
  const description = post.meta_description
    || post.excerpt
    || `Lee ${post.title} en el blog de Cero Studio.`;
  const image = absoluteUrl(post.featured_image) || DEFAULT_OG_IMAGE;
  const imageAlt = post.featured_image_alt || post.title;
  const publishedDate = toIsoDate(post.published_at || post.created_at);

  const blogPostingLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'mainEntityOfPage': { '@type': 'WebPage', '@id': fullUrl },
    'headline': post.title,
    'description': description,
    'image': image,
    'author': {
      '@type': 'Person',
      'name': 'Carlos Luque Ancona',
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Cero Studio',
      'logo': { '@type': 'ImageObject', 'url': PUBLISHER_LOGO },
    },
    'datePublished': publishedDate,
    'dateModified': publishedDate,
    'inLanguage': 'es-MX',
    ...(post.category && { 'articleSection': post.category }),
  };

  // ── Rewrite the SPA shell head ────────────────────────────────────────────
  const rewriter = new HTMLRewriter()
    .on('title', {
      element(el) { el.setInnerContent(title); },
    })
    .on('meta[name="description"]', {
      element(el) { el.setAttribute('content', description); },
    })
    .on('link[rel="canonical"]', {
      element(el) { el.setAttribute('href', fullUrl); },
    })
    .on('meta[property="og:type"]', {
      element(el) { el.setAttribute('content', 'article'); },
    })
    .on('meta[property="og:url"]', {
      element(el) { el.setAttribute('content', fullUrl); },
    })
    .on('meta[property="og:title"]', {
      element(el) { el.setAttribute('content', title); },
    })
    .on('meta[property="og:description"]', {
      element(el) { el.setAttribute('content', description); },
    })
    .on('meta[property="og:image"]', {
      element(el) { el.setAttribute('content', image); },
    })
    .on('meta[name="twitter:card"]', {
      element(el) {
        const articleSection = post.category
          ? `\n  <meta property="article:section" content="${escAttr(post.category)}">`
          : '';
        el.after(
          `\n  <meta name="twitter:title" content="${escAttr(title)}">` +
          `\n  <meta name="twitter:description" content="${escAttr(description)}">` +
          `\n  <meta name="twitter:image" content="${escAttr(image)}">` +
          `\n  <meta property="og:image:alt" content="${escAttr(imageAlt)}">` +
          `\n  <meta property="og:locale" content="es_MX">` +
          `\n  <meta property="article:published_time" content="${publishedDate}">` +
          `\n  <meta property="article:modified_time" content="${publishedDate}">` +
          articleSection +
          `\n  <script type="application/ld+json">${JSON.stringify(blogPostingLd)}</script>`,
          { html: true }
        );
      },
    })
    // ── Replace the SPA shell body with the full server-rendered article ──
    // Sets data-ssr-slug so blog.js knows to skip its own initial render
    // (avoids "CARGANDO BLOG..." flash and double work).
    .on('main#blog-root', {
      element(el) {
        el.setAttribute('data-ssr-slug', post.slug);
        el.setInnerContent(buildArticleHtml(post), { html: true });
      },
    })
    // ── Inline navbar + footer for crawlers ────────────────────────────────
    // Replaces empty placeholders with actual <nav> and <footer> markup so
    // Googlebot sees a complete page (header + article + footer with internal
    // links) instead of an orphan article. Fixes Soft 404 on blog posts.
    .on('#navbar-placeholder', {
      element(el) {
        if (navbarHtml) el.setInnerContent(navbarHtml, { html: true });
      },
    })
    .on('#footer-placeholder', {
      element(el) {
        if (footerHtml) el.setInnerContent(footerHtml, { html: true });
      },
    });

  const transformed = rewriter.transform(assetResponse);
  // Mark response so SSR is verifiable in tests + production debugging
  const headers = { ...Object.fromEntries(transformed.headers), 'X-Cero-SSR': isPreview ? 'preview' : 'ok' };
  if (isPreview) {
    // Un preview de borrador/programado JAMÁS se cachea ni se indexa
    headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0';
    headers['X-Robots-Tag'] = 'noindex, nofollow';
  }
  return new Response(transformed.body, {
    status: transformed.status,
    headers,
  });
}
