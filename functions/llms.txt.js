/**
 * Cloudflare Pages Function: /llms.txt
 * llms.txt dinámico en 3 capas:
 *   1. Header/footer: override editable desde /blog/admin/ (D1 site_settings,
 *      keys 'llms_header' / 'llms_footer'); si no hay override se sirve el
 *      default de functions/_llms-defaults.js.
 *   2. Sección "## Blog": posts publicados desde D1, siempre automática.
 *   3. Best-effort: si D1 no está disponible, defaults + sin blog.
 */

import { LLMS_BASE as BASE, LLMS_DEFAULT_HEADER, LLMS_DEFAULT_FOOTER } from './_llms-defaults.js';

export async function onRequestGet({ env }) {
  let posts = [];
  let header = LLMS_DEFAULT_HEADER;
  let footer = LLMS_DEFAULT_FOOTER;

  // Dos reads independientes: que falle uno no debe tumbar al otro.
  if (env?.DB?.prepare) {
    try {
      const r = await env.DB.prepare(
        "SELECT slug, title FROM posts WHERE status = 'published' ORDER BY published_at DESC"
      ).all();
      posts = r?.results || [];
    } catch {
      posts = [];
    }

    // Overrides del admin (la tabla puede no existir todavía)
    try {
      const { results } = await env.DB.prepare(
        "SELECT key, value FROM site_settings WHERE key IN ('llms_header', 'llms_footer')"
      ).all();
      for (const row of results || []) {
        if (row.key === 'llms_header' && row.value?.trim()) header = row.value;
        if (row.key === 'llms_footer' && row.value?.trim()) footer = row.value;
      }
    } catch {
      /* sin overrides → defaults */
    }
  }

  const blogSection = posts.length
    ? `## Blog\n\n${posts.map(p => `- [${p.title}](${BASE}/blog/${p.slug})`).join('\n')}\n\n`
    : '';

  const body = `${header}\n\n${blogSection}${footer}\n`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
