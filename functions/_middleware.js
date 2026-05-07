/**
 * Cloudflare Pages Middleware: inline navbar + footer for crawlers.
 *
 * Why this exists
 * ---------------
 * The site uses two empty placeholders that get populated client-side:
 *   <div id="navbar-placeholder"></div>
 *   <div id="footer-placeholder"></div>
 *
 * Googlebot's Soft 404 detector (and many other crawlers / AI agents) does not
 * always execute JavaScript before evaluating page quality. Without nav/footer
 * in the initial HTML, it sees an orphan page with no internal links and flags
 * it as Soft 404 — which is exactly what's happening on cerostudio.ai right
 * now (2 pages indexed, 3 Soft 404s, multiple "not found" / "redirect" errors).
 *
 * This middleware runs on every request, lets the asset response come back,
 * and if it's an HTML page with the placeholders, inlines the real navbar +
 * footer markup server-side. JS hydration still works on top of this — the
 * client code's load_partials() is a no-op when the partials are already
 * present (it only fetches when the placeholder is empty).
 *
 * Other functions (e.g. functions/blog/[slug].js) opt out by returning their
 * own already-rewritten response — this middleware only kicks in for static
 * assets that pass through unchanged.
 */

const NAVBAR_PATH = '/components/navbar.html';
const FOOTER_PATH = '/components/footer.html';

// In-memory cache per Worker isolate. Components rarely change, so we avoid
// re-fetching them on every request. Cache is reset on deploy.
let _navbarCache = null;
let _footerCache = null;

async function loadPartial(env, baseUrl, path, cache) {
  if (cache.value !== null) return cache.value;
  try {
    const u = new URL(baseUrl);
    u.pathname = path;
    const res = await env.ASSETS.fetch(u.toString());
    if (!res.ok) {
      cache.value = '';
      return '';
    }
    cache.value = await res.text();
    return cache.value;
  } catch {
    cache.value = '';
    return '';
  }
}

export async function onRequest(context) {
  const response = await context.next();

  // Only rewrite successful HTML responses
  const ct = response.headers.get('content-type') || '';
  if (!ct.includes('text/html')) return response;
  if (response.status >= 400 && response.status !== 404) return response;

  // If a downstream function (e.g. blog/[slug].js) already inlined partials,
  // skip — it sets X-Cero-SSR. The blog SSR handler already injects nav+footer
  // itself, so re-running the rewriter would be redundant work.
  if (response.headers.get('X-Cero-SSR')) return response;

  const navbarCache = { value: _navbarCache };
  const footerCache = { value: _footerCache };

  const [navbarHtml, footerHtml] = await Promise.all([
    loadPartial(context.env, context.request.url, NAVBAR_PATH, navbarCache),
    loadPartial(context.env, context.request.url, FOOTER_PATH, footerCache),
  ]);

  // Persist cache for subsequent requests on the same isolate
  _navbarCache = navbarCache.value;
  _footerCache = footerCache.value;

  if (!navbarHtml && !footerHtml) return response;

  const rewriter = new HTMLRewriter()
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

  const transformed = rewriter.transform(response);
  return new Response(transformed.body, {
    status: transformed.status,
    headers: { ...Object.fromEntries(transformed.headers), 'X-Cero-Partials': 'inlined' },
  });
}
