/**
 * Cloudflare Pages Function: /api/posts
 * Public endpoint — only returns published posts.
 *
 * GET /api/posts              → list (id, title, slug, category, excerpt, featured_image, published_at)
 * GET /api/posts?slug=<slug>  → full single post
 * GET /api/posts?page=N&per=9 → paginated list
 * GET /api/posts?category=<c> → filtered by category
 */

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const slug     = searchParams.get('slug');
  const category = searchParams.get('category');
  const page     = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const per      = Math.min(50, parseInt(searchParams.get('per') || '9', 10));

  try {
    if (slug) {
      const post = await env.DB.prepare(
        "SELECT * FROM posts WHERE slug = ? AND status = 'published' LIMIT 1"
      ).bind(slug).first();
      return post ? json(post) : json({ error: 'Artículo no encontrado' }, 404);
    }

    const offset = (page - 1) * per;

    if (category) {
      const { results } = await env.DB.prepare(
        `SELECT id, title, slug, category, excerpt, featured_image, published_at
         FROM posts WHERE status = 'published' AND category = ?
         ORDER BY published_at DESC LIMIT ? OFFSET ?`
      ).bind(category, per, offset).all();
      return json(results);
    }

    const { results } = await env.DB.prepare(
      `SELECT id, title, slug, category, excerpt, featured_image, published_at
       FROM posts WHERE status = 'published'
       ORDER BY published_at DESC LIMIT ? OFFSET ?`
    ).bind(per, offset).all();

    return json(results);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
