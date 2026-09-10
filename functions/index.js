/**
 * Cloudflare Pages Function: /
 * Intercepts the homepage and injects pre-rendered portfolio HTML server-side
 * using HTMLRewriter — zero client-side fetch, zero performance cost.
 * Inyecta el portafolio principal (#portfolio-dynamic ← tag 'home').
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
    // Bloque de DATOS (type="application/json"), no un script ejecutable: la CSP
    // del sitio no permite scripts en línea ('script-src' sin unsafe-inline) y
    // bloqueaba silenciosamente la versión anterior. Escapar '<' impide que un
    // '</script>' dentro del JSON rompa/inyecte HTML.
    const i18nScript = i18nCache?.value
      ? `<script type="application/json" id="cs-portfolio-i18n">${i18nCache.value.replace(/</g, '\\u003c')}</script>`
      : '';

    return new HTMLRewriter()
      .on('#portfolio-dynamic', {
        element(el) {
          if (portfolioHTML) el.setInnerContent(portfolioHTML, { html: true });
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
