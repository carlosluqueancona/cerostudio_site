/**
 * Cloudflare Pages Function: /llms.txt
 * llms.txt dinámico ensamblado por secciones:
 *   1. Cada sección de functions/_llms-defaults.js puede tener un override
 *      individual en D1 (site_settings, key = section.key), editable desde
 *      /blog/admin/ → tab llms.txt. Sección sin override = default del código
 *      (así los cambios de código llegan solos a lo no personalizado).
 *   2. Sección "## Blog": posts publicados desde D1, siempre automática,
 *      insertada antes de llms_footer.
 *   3. Best-effort: si D1 no está disponible, defaults + sin blog.
 */

import { LLMS_BASE as BASE, LLMS_SECTIONS } from './_llms-defaults.js';

export async function onRequestGet({ env }) {
  let posts = [];
  const overrides = {};

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
        "SELECT key, value FROM site_settings WHERE key LIKE 'llms_%'"
      ).all();
      for (const row of results || []) {
        if (row.value?.trim()) overrides[row.key] = row.value;
      }
    } catch {
      /* sin overrides → defaults */
    }
  }

  const blogSection = posts.length
    ? `## Blog\n\n${posts.map(p => `- [${p.title}](${BASE}/blog/${p.slug})`).join('\n')}`
    : '';

  const parts = [];
  for (const section of LLMS_SECTIONS) {
    if (section.key === 'llms_footer' && blogSection) parts.push(blogSection);
    parts.push(overrides[section.key] || section.content);
  }

  return new Response(parts.join('\n\n') + '\n', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
