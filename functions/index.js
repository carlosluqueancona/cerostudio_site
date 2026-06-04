/**
 * Cloudflare Pages Function: /
 * Intercepts the homepage and injects pre-rendered portfolio HTML server-side
 * using HTMLRewriter — zero client-side fetch, zero performance cost.
 */

export async function onRequest(context) {
  const { env, request } = context;

  // Fetch the static HTML asset
  const response = await env.ASSETS.fetch(request);

  // If not HTML, pass through unchanged
  const ct = response.headers.get('Content-Type') || '';
  if (!ct.includes('text/html')) return response;

  try {
    // Prefiere cache filtrado por tag 'home' (Carlos elige qué featurear);
    // fallback a cache global legacy si tag aún no existe.
    const [tagHtml, tagI18n, globalHtml, globalI18n] = await Promise.all([
      env.DB.prepare("SELECT value FROM site_cache WHERE key = 'portfolio_html_tag_home'").first(),
      env.DB.prepare("SELECT value FROM site_cache WHERE key = 'portfolio_i18n_tag_home'").first(),
      env.DB.prepare("SELECT value FROM site_cache WHERE key = 'portfolio_html'").first(),
      env.DB.prepare("SELECT value FROM site_cache WHERE key = 'portfolio_i18n'").first(),
    ]);

    const htmlCache = tagHtml?.value ? tagHtml : globalHtml;
    const i18nCache = tagI18n?.value ? tagI18n : globalI18n;

    // No cache yet — serve static HTML as-is
    if (!htmlCache?.value) return response;

    const portfolioHTML = htmlCache.value;
    const i18nScript = i18nCache?.value
      ? `<script>window.CS_PORTFOLIO_I18N=${i18nCache.value};</script>`
      : '';

    return new HTMLRewriter()
      .on('#portfolio-dynamic', {
        element(el) {
          el.setInnerContent(portfolioHTML, { html: true });
        },
      })
      .on('body', {
        element(el) {
          if (i18nScript) el.append(i18nScript, { html: true });
        },
      })
      .transform(response);

  } catch (err) {
    console.error('[index SSR] Error:', err);
    return response; // fallback to static
  }
}
