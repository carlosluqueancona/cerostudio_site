/**
 * Cloudflare Pages Function: /
 * Intercepts the homepage and injects pre-rendered portfolio HTML server-side
 * using HTMLRewriter — zero client-side fetch, zero performance cost.
 * Inyecta dos bloques del CMS:
 *   - #portfolio-dynamic        ← tag 'home'      (portafolio principal)
 *   - #tiendas-portfolio-grid   ← tag 'ecommerce' (ejemplos en #tiendas)
 */

/* Los cards del CMS usan ids secuenciales port-c1/port-d1 por tag. Para poder
   convivir con el portafolio principal en la misma página, el bloque de
   tiendas se re-prefija a tport-* (HTML e i18n) antes de inyectarse. */
function prefixTiendaIds(html) {
  return html.replace(/id="port-(c|d)(\d+)"/g, 'id="tport-$1$2"');
}

function prefixTiendaI18n(i18nJson) {
  try {
    const data = JSON.parse(i18nJson);
    const out = {};
    for (const lang of Object.keys(data)) {
      out[lang] = {};
      for (const key of Object.keys(data[lang])) {
        out[lang][key.replace(/^port-(c|d)/, 'tport-$1')] = data[lang][key];
      }
    }
    return out;
  } catch {
    return null;
  }
}

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
    const [tagHtml, tagI18n, globalHtml, globalI18n, ecomHtml, ecomI18n] = await Promise.all([
      env.DB.prepare("SELECT value FROM site_cache WHERE key = 'portfolio_html_tag_home'").first(),
      env.DB.prepare("SELECT value FROM site_cache WHERE key = 'portfolio_i18n_tag_home'").first(),
      env.DB.prepare("SELECT value FROM site_cache WHERE key = 'portfolio_html'").first(),
      env.DB.prepare("SELECT value FROM site_cache WHERE key = 'portfolio_i18n'").first(),
      env.DB.prepare("SELECT value FROM site_cache WHERE key = 'portfolio_html_tag_ecommerce'").first(),
      env.DB.prepare("SELECT value FROM site_cache WHERE key = 'portfolio_i18n_tag_ecommerce'").first(),
    ]);

    const htmlCache = tagHtml?.value ? tagHtml : globalHtml;
    const i18nCache = tagI18n?.value ? tagI18n : globalI18n;
    const tiendasHTML = ecomHtml?.value ? prefixTiendaIds(ecomHtml.value) : '';

    // No cache yet — serve static HTML as-is
    if (!htmlCache?.value && !tiendasHTML) return response;

    const portfolioHTML = htmlCache?.value || '';

    /* i18n combinado: portafolio principal + tiendas (claves tport-* no chocan) */
    let mergedI18n = null;
    if (i18nCache?.value) {
      try { mergedI18n = JSON.parse(i18nCache.value); } catch { mergedI18n = null; }
    }
    const tiendasI18n = ecomI18n?.value ? prefixTiendaI18n(ecomI18n.value) : null;
    if (tiendasI18n) {
      mergedI18n = mergedI18n || {};
      for (const lang of Object.keys(tiendasI18n)) {
        mergedI18n[lang] = Object.assign(mergedI18n[lang] || {}, tiendasI18n[lang]);
      }
    }
    const i18nScript = mergedI18n
      ? `<script>window.CS_PORTFOLIO_I18N=${JSON.stringify(mergedI18n)};</script>`
      : '';

    return new HTMLRewriter()
      .on('#portfolio-dynamic', {
        element(el) {
          if (portfolioHTML) el.setInnerContent(portfolioHTML, { html: true });
        },
      })
      .on('#tiendas-portfolio-grid', {
        element(el) {
          if (tiendasHTML) el.setInnerContent(tiendasHTML, { html: true });
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
