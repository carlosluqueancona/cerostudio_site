/**
 * Cloudflare Pages Function: /blog/[slug]
 * Serves /blog/index.html for any blog post URL so the SPA
 * can handle client-side routing.
 * Static files (blog.js, blog.css, admin/) take precedence
 * over this function automatically.
 */
export async function onRequest(context) {
  const slug = context.params.slug;

  // Redirect /blog/admin → /blog/admin/
  if (slug === 'admin') {
    return Response.redirect(new URL('/blog/admin/', context.request.url).origin + '/blog/admin/', 301);
  }

  const url = new URL(context.request.url);
  url.pathname = '/blog/index.html';
  return context.env.ASSETS.fetch(url.toString());
}
