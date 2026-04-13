/**
 * Cloudflare Pages Function: /blog/[slug]
 * Serves /blog/index.html for any blog post URL so the SPA
 * can handle client-side routing.
 * Static files (blog.js, blog.css, admin/) take precedence
 * over this function automatically.
 */
export async function onRequest(context) {
  const slug = context.params.slug;

  // Pass through static assets (js, css, images, etc.)
  if (/\.[a-zA-Z0-9]+$/.test(slug)) {
    return context.env.ASSETS.fetch(context.request);
  }

  // Redirect /blog/admin → /blog/admin/
  if (slug === 'admin') {
    const origin = new URL(context.request.url).origin;
    return Response.redirect(origin + '/blog/admin/', 301);
  }

  // Serve blog SPA for post slugs
  const url = new URL(context.request.url);
  url.pathname = '/blog/index.html';
  return context.env.ASSETS.fetch(url.toString());
}
