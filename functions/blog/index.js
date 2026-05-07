/**
 * Cloudflare Pages Function: /blog/  (the index/list page)
 *
 * Server-renders the blog post grid into /blog/index.html so Googlebot sees
 * the article list immediately instead of "CARGANDO BLOG..." (which causes a
 * Soft 404 — confirmed in GSC URL Inspection > Live Test).
 *
 * Mirrors the markup that blog.js renderList() produces client-side. blog.js
 * detects the data-ssr-list attribute and skips its own initial render.
 *
 * If D1 is unavailable (local dev without binding), we fall through to the
 * SPA shell as-is and let the client fetch /api/posts — matching the
 * behavior of functions/blog/[slug].js.
 */

const BASE_URL = 'https://cerostudio.ai';

function escAttr(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function escHtml(s) {
  return String(s ?? '').replace(/[&<>]/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]
  ));
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

function postCardHtml(post) {
  const hasThumb = !!post.featured_image;
  const thumbHtml = hasThumb
    ? `<div class="post-card-thumb"><img src="${escAttr(post.featured_image)}" alt="${escAttr(post.title)}" loading="lazy"></div>`
    : '';
  const slug = escAttr(post.slug);
  return `<article class="post-card${hasThumb ? ' has-thumb' : ''}" onclick="navigate(null, '/blog/${slug}')" style="cursor: pointer;">`
    + thumbHtml
    + '<div class="post-card-body">'
    + `<div class="post-card-cat">${escHtml(post.category || 'General')}</div>`
    + `<h2 class="post-card-title">${escHtml(post.title)}</h2>`
    + `<p class="post-card-excerpt">${escHtml(post.excerpt || '')}</p>`
    + `<div class="post-card-meta">${escHtml(formatDateEsMx(post.published_at))}</div>`
    + '</div>'
    + '</article>';
}

function buildListHtml(posts, hasMore) {
  const cardsHtml = posts.length
    ? posts.map(postCardHtml).join('')
    : '<p style="grid-column: 1 / -1; text-align: center; padding: 60px 0; color: rgba(255,255,255,.6);">Próximamente nuevos artículos.</p>';

  return [
    '<a id="main-content" tabindex="-1"></a>',
    '<header class="blog-hero">',
    '  <div class="section-inner">',
    '    <div class="eyebrow">Nuestro Blog</div>',
    '    <h1 class="section-title">Insights sobre diseño <br class="pc-only"> y tecnología</h1>',
    '  </div>',
    '</header>',
    '<div class="section-inner">',
    '  <div class="blog-grid" id="blog-grid">',
    `    ${cardsHtml}`,
    '  </div>',
    `  <div class="load-more-wrap" id="load-more-wrap"${hasMore ? '' : ' style="display:none"'}>`,
    '    <button class="load-more-btn" id="load-more-btn" onclick="loadMore()">Ver más artículos</button>',
    '  </div>',
    '</div>',
  ].join('\n');
}

const INITIAL_LOAD = 50; // matches blog.js INITIAL_LOAD

export async function onRequest(context) {
  // Only intercept exact /blog/ — anything with a trailing path segment is
  // handled by [slug].js (Cloudflare Pages routes /blog/foo to [slug].js).
  // This function only runs for /blog/ and /blog (the index).

  // Best-effort D1 lookup. If unavailable, fall through to SPA shell.
  let posts = null;
  let dbAvailable = false;
  try {
    if (context.env?.DB?.prepare) {
      const result = await context.env.DB.prepare(
        `SELECT title, slug, category, featured_image, excerpt, published_at, created_at
           FROM posts
          WHERE status = 'published'
          ORDER BY published_at DESC, created_at DESC
          LIMIT ?`
      ).bind(INITIAL_LOAD).all();
      posts = result?.results || [];
      dbAvailable = true;
    }
  } catch (_) {
    dbAvailable = false;
  }

  // Fetch the SPA shell
  const shellUrl = new URL(context.request.url);
  shellUrl.pathname = '/blog/index.html';
  const assetResponse = await context.env.ASSETS.fetch(shellUrl.toString());

  // No D1 → return SPA shell as-is (client-side fallback works fine).
  if (!dbAvailable) {
    return new Response(assetResponse.body, {
      status: assetResponse.status,
      headers: { ...Object.fromEntries(assetResponse.headers), 'X-Cero-SSR': 'fallback' },
    });
  }

  // Fetch navbar + footer in parallel so the rendered page is fully
  // self-contained for crawlers (no client-side hydration needed).
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

  const hasMore = posts.length >= INITIAL_LOAD;
  const listHtml = buildListHtml(posts, hasMore);

  const rewriter = new HTMLRewriter()
    .on('main#blog-root', {
      element(el) {
        // Signal to blog.js that the list is already rendered server-side
        // so it skips its initial renderList() call (mirrors the data-ssr-slug
        // pattern used by [slug].js for individual post pages).
        el.setAttribute('data-ssr-list', 'true');
        el.setInnerContent(listHtml, { html: true });
      },
    })
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
  return new Response(transformed.body, {
    status: transformed.status,
    headers: { ...Object.fromEntries(transformed.headers), 'X-Cero-SSR': 'list' },
  });
}
