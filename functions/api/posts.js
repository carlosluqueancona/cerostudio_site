/**
 * Cloudflare Pages Function: /api/posts
 * Handles GET requests to fetch blog posts from D1 database.
 */

export async function onRequestGet(context) {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  try {
    if (slug) {
      // Fetch single post
      const post = await env.DB.prepare(
        "SELECT * FROM posts WHERE slug = ? AND status = 'published' LIMIT 1"
      ).bind(slug).first();

      if (!post) {
        return new Response(JSON.stringify({ error: "Post not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify(post), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      // Get list of published posts
      const { results } = await env.DB.prepare('SELECT id, title, slug, category, excerpt, published_at FROM posts WHERE status = "published" ORDER BY published_at DESC').all();
      return new Response(JSON.stringify(results), { 
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
