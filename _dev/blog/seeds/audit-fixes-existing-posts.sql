-- ─────────────────────────────────────────────────────────────────────────────
-- Cero Studio Blog · SEO audit fixes for the 9 pre-existing posts
--
-- Fixes (idempotent):
--   1. Replace wrong brand "Tomate.MX" with "Cero Studio" in mainoflex post
--   2. Normalize categories to Title Case for consistency
--   3. Set default featured_image on posts missing one
--   4. Add "| Cero Studio" suffix to short meta_titles (only when total ≤70 chars)
--
-- Run remote:
--   wrangler d1 execute DB --remote --file=blog/seeds/audit-fixes-existing-posts.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Fix wrong brand (Tomate.MX → Cero Studio) ────────────────────────────
UPDATE posts
SET meta_title = REPLACE(meta_title, 'Tomate.MX', 'Cero Studio')
WHERE slug = 'caso-exito-mainoflex-ventas-40-porciento'
  AND meta_title LIKE '%Tomate.MX%';

UPDATE posts
SET content = REPLACE(content, 'Tomate.MX', 'Cero Studio')
WHERE content LIKE '%Tomate.MX%';

UPDATE posts
SET excerpt = REPLACE(excerpt, 'Tomate.MX', 'Cero Studio')
WHERE excerpt LIKE '%Tomate.MX%';

-- ── 2. Normalize categories to Title Case ───────────────────────────────────
UPDATE posts SET category = 'Diseño Web'         WHERE category = 'diseño web';
UPDATE posts SET category = 'eCommerce'          WHERE category IN ('ecommerce', 'Ecommerce');
UPDATE posts SET category = 'SEO'                WHERE category = 'seo';
UPDATE posts SET category = 'Marketing Digital'  WHERE category = 'marketing digital';
UPDATE posts SET category = 'Casos de Éxito'     WHERE category IN ('casos de éxito', 'casos de exito');

-- ── 3. Set default featured_image on posts missing one ──────────────────────
UPDATE posts
SET featured_image = '/images/CERO_Studio_SocialShare.png',
    featured_image_alt = COALESCE(featured_image_alt, title || ' · Cero Studio')
WHERE featured_image IS NULL
  AND status = 'published';

-- ── 4. Append "| Cero Studio" to all meta_titles missing brand suffix ───────
-- Threshold 80 chars: Google truncates at ~60 in SERP, but the full title
-- stays in the HTML for crawlers + brand consistency wins over visual perfection.
-- Resulting titles are 67-78 chars, comparable to the two newest posts (72-77).
UPDATE posts
SET meta_title = meta_title || ' | Cero Studio'
WHERE status = 'published'
  AND meta_title NOT LIKE '%Cero Studio%'
  AND length(meta_title) + 14 <= 80;
