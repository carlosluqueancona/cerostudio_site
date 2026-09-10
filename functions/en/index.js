/**
 * Cloudflare Pages Function: /en/
 * Igual que functions/index.js (home ES) pero para la home EN: inyecta el
 * portafolio pre-renderizado EN (#portfolio-dynamic ← tag 'home', sufijo _en)
 * con fallback al HTML ES si la variante EN no existe en site_cache.
 */

export async function onRequest(context) {
  const { env, request } = context;

  const response = await env.ASSETS.fetch(request);

  const ct = response.headers.get('Content-Type') || '';
  if (!ct.includes('text/html')) return response;

  try {
    const [enHtml, esHtml, i18nRow] = await Promise.all([
      env.DB.prepare("SELECT value FROM site_cache WHERE key = 'portfolio_html_tag_home_en'").first(),
      env.DB.prepare("SELECT value FROM site_cache WHERE key = 'portfolio_html_tag_home'").first(),
      env.DB.prepare("SELECT value FROM site_cache WHERE key = 'portfolio_i18n_tag_home'").first(),
    ]);

    const portfolioHTML = enHtml?.value || esHtml?.value || '';
    if (!portfolioHTML) return response;

    // Bloque de DATOS (type="application/json"), no un script ejecutable: la CSP
    // del sitio no permite scripts en línea. Escapar '<' impide que un
    // '</script>' dentro del JSON rompa/inyecte HTML.
    const i18nScript = i18nRow?.value
      ? `<script type="application/json" id="cs-portfolio-i18n">${i18nRow.value.replace(/</g, '\\u003c')}</script>`
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
    console.error('[en/index SSR] Error:', err);
    return response; // fallback al estático
  }
}
